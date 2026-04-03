const zh = {
  // Common
  'common.cancel': '取消',
  'common.delete': '删除',
  'common.save': '保存',
  'common.done': '完成',
  'common.back': '返回',

  // Tab bar
  'tabs.home': 'Drip',
  'tabs.timeline': '时间轴',
  'tabs.insights': '分析',
  'tabs.settings': '设置',

  // Home
  'home.totalCost': '总费用',
  'home.workHours': '工作时长',
  'home.subsCount_other': '{{count}} 个订阅',
  'home.trialsCount_other': '{{count}} 个试用',
  'home.holdToReorder': '长按排序',
  'home.cancelled': '已取消',
  'home.setIncome': '设置收入',
  'home.percentIncome': '% 收入',
  'home.toEarnThis': '赚取此费用所需',
  'home.ofMonthly': '占月收入',

  // Settings
  'settings.title': '设置',
  'settings.totalMonthlyCost': '每月总费用',
  'settings.incomeRate': '收入与时薪',
  'settings.monthlyIncome': '月收入',
  'settings.baselineInsights': '预算分析基准',
  'settings.updateIncome': '更新收入',
  'settings.data': '数据',
  'settings.manageCategories': '管理分类',
  'settings.categoriesCount': '{{count}} 个分类',
  'settings.general': '通用',
  'settings.appearance': '外观',
  'settings.light': '浅色',
  'settings.currency': '货币',
  'settings.language': '语言',
  'settings.notifications': '通知',
  'settings.notificationTime': '通知时间',
  'settings.enableNotifications': '在系统设置中启用通知',
  'settings.version': 'Drip v1.0 · 用时间衡量每一笔支出',

  // Calendar / Timeline
  'calendar.title': '时间轴',
  'calendar.nextUp': '即将到来',
  'calendar.daysLeft_other': '剩余 {{count}} 天',
  'calendar.proTitle': '解锁 Pro 洞察',
  'calendar.proDesc': '查看所有即将到来的扣费、月度汇总及完整的订阅活动。',
  'calendar.upgrade': '获取 Pro',

  // Insights
  'insights.title': '分析',
  'insights.categoryBreakdown': '分类明细',
  'insights.subsPercent': '{{pct}} 个订阅',
  'insights.income': '收入 {{amount}}',

  // Add subscription
  'addSub.title': '添加订阅',
  'addSub.searchPlaceholder': '搜索订阅...',
  'addSub.popularServices': '热门服务',
  'addSub.noResults': '"{{query}}" 无结果',
  'addSub.addCustom': '添加自定义订阅',
  'addSub.name': '名称',
  'addSub.priceBilling': '价格与账单周期',
  'addSub.category': '分类',
  'addSub.startDate': '开始日期',
  'addSub.billsOnDate': '每个周期在此日期扣款',
  'addSub.iconColor': '图标与颜色',
  'addSub.tapToChange': '点击更改图标或颜色',
  'addSub.freeTrial': '免费试用',
  'addSub.trialReminder': '到期前提醒',
  'addSub.trialLength': '试用时长',
  'addSub.custom': '自定义',
  'addSub.reminder': '提醒',
  'addSub.addTrial': '添加试用',
  'addSub.addSubscription': '添加订阅',

  // Edit subscription
  'editSub.title': '编辑订阅',
  'editSub.saveChanges': '保存更改',
  'editSub.remove': '移除',
  'editSub.confirmRemoveTitle': '移除订阅',
  'editSub.confirmRemoveMessage': '确定要移除 {{name}} 吗？',
  'editSub.active': '激活',
  'editSub.toggleCancel': '关闭以取消订阅',

  // Billing cycles
  'billing.everyWeek': '每周',
  'billing.every2Weeks': '每两周',
  'billing.everyMonth': '每月',
  'billing.every3Months': '每三个月',
  'billing.every6Months': '每六个月',
  'billing.everyYear': '每年',
  'billing.custom': '自定义...',

  // Cycle labels (for SubRow display)
  'cycle.weekly': '每周',
  'cycle.biweekly': '每两周',
  'cycle.monthly': '每月',
  'cycle.quarterly': '每季度',
  'cycle.biannual': '每6个月',
  'cycle.yearly': '每年',
  'cycle.custom': '每 {{num}} {{unit}}',

  // Reminders
  'reminder.never': '从不',
  'reminder.1day': '提前1天',
  'reminder.2days': '提前2天',
  'reminder.3days': '提前3天',
  'reminder.7days': '提前7天',

  // Income
  'income.addIncome': '添加收入',
  'income.updateIncome': '更新收入',
  'income.type': '类型',
  'income.annualSalary': '年薪',
  'income.hourlyRate': '时薪',
  'income.annualSalaryLabel': '年薪',
  'income.hourlyRateLabel': '时薪',
  'income.hoursPerWeek': '每周工时',
  'income.calculateRate': '计算时薪',

  // Trial
  'trial.endsIn_other': '试用将在 {{count}} 天后结束',
  'trial.keepSubscription': '保留订阅',
  'trial.cancelSubscription': '取消订阅',

  // Categories
  'categories.title': '分类',
  'categories.addCategory': '+ 添加分类',
  'categories.deleteTitle': '删除分类？',
  'categories.deleteMsg_other': '{{count}} 个订阅将移至"{{name}}"',
  'categories.subsCount': '{{count}} 个订阅',

  // Budget health
  'budget.title': '预算健康',
  'budget.ofIncome': '% 收入',
  'budget.healthy': '健康',
  'budget.moderate': '适中',
  'budget.high': '偏高',
  'budget.alert': '警告',
  'budget.setIncome': '设置收入',

  // Income CTA
  'incomeCta.message': '设置收入，以工作时长查看费用',

  // Summary
  'summary.title': '摘要',
  'summary.activeSubs': '{{count}} 个活跃订阅',

  // Default categories
  'categoryDefaults.entertainment': '娱乐',
  'categoryDefaults.productivity': '效率',
  'categoryDefaults.health': '健康',
  'categoryDefaults.finance': '金融',
  'categoryDefaults.education': '教育',
  'categoryDefaults.other': '其他',

  // SubRow
  'subRow.trial': '试用',
  'subRow.daysLeft': '剩 {{count}} 天',
  'subRow.wasCost': '原价 {{cost}}',
  'subRow.trialEnded': '试用结束',

  // Upcoming charge
  'upcoming.tomorrow': '明天',
  'upcoming.days': '{{count}} 天后',
  'upcoming.daysShort': '{{count}} 天',

  // Appearance modal
  'appearance.title': '外观',
  'appearance.preview': '预览',
  'appearance.emoji': 'Emoji',
  'appearance.icons': '图标',
  'appearance.color': '颜色',
  'appearance.subscription': '订阅',

  // Currency sheet
  'currencySheet.title': '货币',
  'currencySheet.search': '搜索货币...',

  // Time formatting
  'time.today': '今天',
  'time.dayLeft': '剩余1天',
  'time.daysLeft': '剩余 {{count}} 天',
  'time.monthLeft': '剩余 {{count}} 个月',
  'time.monthsLeft': '剩余 {{count}} 个月',
  'time.yearLeft': '剩余 {{count}} 年',
  'time.h': '时',
  'time.m': '分',
  'time.min': '分钟',

  // Time tiers
  'tier.extreme': '极高',
  'tier.veryHigh': '非常高',
  'tier.high': '高',
  'tier.moderate': '适中',
  'tier.low': '低',
  'tier.minimal': '极低',

  // Language
  'language.title': '语言',
  'language.auto': '自动（系统）',

  // Lifetime cost
  'lifetime.title': '累计费用',
  'lifetime.sinceTracked': '自首次追踪起',
  'lifetime.thisMonth': '本月',
  'lifetime.since': '自 {{month}} 起 · {{count}} 个月',
  'lifetime.months': '{{count}} 个月',
  'lifetime.allTime': '总计：',

  // Activity
  'activity.title': '动态',
  'activity.noChanges': '本月无变动',
  'activity.added': '已添加',
  'activity.cancelled': '已取消',
  'activity.reactivated': '已重新激活',
  'activity.priceChange': '价格 → {{cost}}',
  'activity.cycleChange': '账单周期已更改',

  // Spending trend
  'spending.title': '支出趋势',
  'spending.empty': '第一个月后将显示您的支出趋势。',
  'spending.vsLastMonth': '较上月',

  // Breakdown
  'breakdown.title': '{{month}} 明细',
  'breakdown.other': '其他',

  // Pro / Paywall
  'pro.badge': 'PRO',
  'pro.unlockPro': '解锁 Drip Pro',
  'pro.priceOnce': '{{price}} 解锁',
  'pro.ctaButton': '解锁 Pro',
  'pro.restorePurchase': '恢复购买',
  'pro.notNow': '暂时不用',
  'pro.unlocked': 'Pro — 已解锁',
  'pro.upgradeToPro': '升级到 Pro',
  'pro.upgradePrice': '¥28',
  'pro.purchaseSuccess': '欢迎使用 Drip Pro！',
  'pro.restoreSuccess': '购买已恢复！',
  'pro.restoreNone': '未找到之前的购买记录',
  'pro.headline.subs': '追踪所有订阅',
  'pro.desc.subs': '解除2个订阅的限制，追踪你支付的每项服务。',
  'pro.headline.insights': '查看消费趋势',
  'pro.desc.insights': '解锁完整的消费历史、分类明细和终生费用。',
  'pro.headline.calendar': '不再错过续费',
  'pro.desc.calendar': '查看所有订阅的完整续费时间线。',
  'pro.headline.trial': '掌控试用期',
  'pro.desc.trial': '追踪免费试用，在开始收费前收到提醒。',
  'pro.headline.categories': '自定义分类',
  'pro.desc.categories': '自定义分类图标、颜色和顺序。',
  'pro.feature.unlimitedSubs': '无限订阅',
  'pro.feature.fullInsights': '完整消费洞察与趋势',
  'pro.feature.fullCalendar': '完整续费日历',
  'pro.feature.trialTracking': '试用追踪与提醒',
  'pro.feature.customCategories': '自定义分类',
  'pro.subLimitHint': '升级 Pro 添加更多',

  // Onboarding
  'onboarding.headline': '看看你的订阅真正花了多少',
  'onboarding.headlineAccent': '— 用你的工作时间衡量',
  'onboarding.subtitle': 'Drip 将每一笔订阅转化为你需要工作的时间。',
  'onboarding.getStarted': '开始使用',
  'onboarding.continue': '继续',
  'onboarding.skip': '跳过',
  'onboarding.incomeQuestion': '你的月收入是多少？',
  'onboarding.incomeHint': '这帮助我们计算你为每个订阅工作了多少小时。',
  'onboarding.feature.calendar': '续费日历',
  'onboarding.feature.calendarDesc': '不再错过续费 — 一目了然地查看每笔即将到来的费用。',
  'onboarding.feature.insights': '消费洞察',
  'onboarding.feature.insightsDesc': '追踪消费趋势，了解你的钱花在了哪里。',
  'onboarding.feature.trials': '试用追踪',
  'onboarding.feature.trialsDesc': '在免费试用开始收费前掌控它们。',
};

export default zh;
