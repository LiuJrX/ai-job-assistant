from __future__ import annotations

import asyncio
import logging
import socket
import subprocess
import time
import urllib.request
from pathlib import Path

from playwright.async_api import async_playwright

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
)
logger = logging.getLogger(__name__)
LOGIN_URL = "https://www.zhipin.com/web/user/?ka=header-login"
LOGIN_URL_PATH_HINT = "/web/user/"
PROFILE_DIR = Path(".pw-user-data") / "boss"
CHROME_BIN = Path("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")


def get_free_port() -> int:
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def wait_for_cdp_endpoint(port: int, timeout_seconds: int = 60) -> str:
    deadline = time.monotonic() + timeout_seconds
    url = f"http://127.0.0.1:{port}/json/version"
    while time.monotonic() < deadline:
        try:
            with urllib.request.urlopen(url, timeout=1) as resp:
                payload = resp.read().decode("utf-8")
            marker = '"webSocketDebuggerUrl":"'
            start = payload.find(marker)
            if start != -1:
                start += len(marker)
                end = payload.find('"', start)
                if end != -1:
                    return payload[start:end]
        except Exception:
            time.sleep(0.25)
    raise TimeoutError(f"CDP endpoint was not ready within {timeout_seconds} seconds.")


async def wait_for_boss_login(timeout_minutes: int = 5) -> None:
    deadline = time.monotonic() + timeout_minutes * 60
    PROFILE_DIR.mkdir(parents=True, exist_ok=True)
    cdp_port = get_free_port()
    chrome_proc = subprocess.Popen(
        [
            str(CHROME_BIN),
            f"--remote-debugging-port={cdp_port}",
            f"--user-data-dir={PROFILE_DIR}",
            "--no-first-run",
            "--no-default-browser-check",
            LOGIN_URL,
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    try:
        ws_endpoint = wait_for_cdp_endpoint(cdp_port)
        async with async_playwright() as pw:
            browser = await pw.chromium.connect_over_cdp(ws_endpoint)
            context = (
                browser.contexts[0] if browser.contexts else await browser.new_context()
            )
            page = await context.new_page()
            await page.bring_to_front()

            logger.info("Navigating to Boss login page: %s", LOGIN_URL)
            try:
                await page.goto(
                    LOGIN_URL, wait_until="domcontentloaded", timeout=30_000
                )
            except Exception as e:
                logger.error("Failed to load login page: %s", e)
                await browser.close()
                raise

            logger.info("Current URL after goto: %s", page.url)
            if LOGIN_URL_PATH_HINT not in page.url:
                logger.info("Boss session is already active: %s", page.url)
                await browser.close()
                return

            logger.info("Waiting for manual login (timeout=%dm)...", timeout_minutes)

            while time.monotonic() < deadline:
                try:
                    if page.is_closed():
                        break

                    current_url = page.url
                    if LOGIN_URL_PATH_HINT not in current_url:
                        logger.info("Boss login detected by redirect: %s", current_url)
                        await browser.close()
                        return

                    await page.wait_for_timeout(10000)
                except Exception as e:
                    logger.warning("Poll error: %s", e)
                    await page.wait_for_timeout(10000)

            try:
                logger.warning("Login not detected. Final URL: %s", page.url)
            except Exception:
                pass
            raise TimeoutError(
                f"Boss login was not detected within {timeout_minutes} minutes."
            )
    finally:
        if chrome_proc.poll() is None:
            chrome_proc.terminate()
            try:
                chrome_proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                chrome_proc.kill()

    return None
