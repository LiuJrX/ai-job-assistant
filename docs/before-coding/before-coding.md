
# 详细方案设计

## 找工作流程：
1. 访问招聘平台登录 URL
2. 如果是未登录（不会自动访问首页），挂起，webhook 通知飞书机器人，手机飞书收到通知可给电脑做登录操作
3. 如果已登录，访问的 登录 URL 会转向 首页 URL
4. 访问登录 URL 后，每 10 秒检查一次是否已经登录（跳出登录路径），超过 60s 终止（循环 6 次）

# 招聘平台

## Boss 直聘

### URL 详细

1. 登录 URL：`https://www.zhipin.com/web/user/?ka=header-login`
2. 首页 URL：`https://www.zhipin.com`，未登录情况下访问首页不会转向登录页
3. 找工作 URL：`https://www.zhipin.com/web/geek/jobs?city=101280700&salary=406&experience=104,105&query=agent开发`
参数说明：
- `city`：城市代码，深圳 101280600、珠海 101280700、重庆 101040100、广州 101280100、杭州 101210100
- `salary`：工资，20-50K(406)
- `experience`：工作经验，1-3 年(104)、3-5 年(105)
- `query`：岗位关键词

## 猎聘

### URL 详细

1. 登录 URL：`https://www.liepin.com/login`
2. 首页 URL：`https://c.liepin.com/`，未登录情况下访问首页不会转向登录页
3. 找工作 URL: `https://www.liepin.com/zhaopin/?city=050090&currentPage=0&pageSize=40&key=agent&workYearCode=1$3&salaryCode=5`
参数说明：
- `city`：城市代码，深圳 050090、珠海 050140、重庆 040、广州 050020、杭州 070020
- `salaryCode`：工资，20-50K(2)
- `workYearCode`：工作经验，1-3 年(1$3)、3-5 年(3$5)
- `key`：岗位关键词