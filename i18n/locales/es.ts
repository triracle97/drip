const es = {
  // Common
  'common.cancel': 'Cancelar',
  'common.delete': 'Eliminar',
  'common.save': 'Guardar',
  'common.done': 'Listo',
  'common.back': 'Volver',

  // Tab bar
  'tabs.home': 'Drip',
  'tabs.timeline': 'Cronología',
  'tabs.insights': 'Análisis',
  'tabs.settings': 'Ajustes',

  // Home
  'home.totalCost': 'Costo Total',
  'home.workHours': 'Horas de Trabajo',
  'home.subsCount_one': '{{count}} suscripción',
  'home.subsCount_other': '{{count}} suscripciones',
  'home.trialsCount_one': '{{count}} prueba',
  'home.trialsCount_other': '{{count}} pruebas',
  'home.holdToReorder': 'Mantén para reordenar',
  'home.cancelled': 'Cancelado',
  'home.setIncome': 'configurar ingresos',
  'home.percentIncome': '% de ingresos',
  'home.toEarnThis': 'para ganar esto',
  'home.ofMonthly': 'del mensual',

  // Settings
  'settings.title': 'Ajustes',
  'settings.totalMonthlyCost': 'COSTO MENSUAL TOTAL',
  'settings.incomeRate': 'INGRESOS Y TARIFA',
  'settings.monthlyIncome': 'Ingresos Mensuales',
  'settings.baselineInsights': 'Base para análisis de presupuesto',
  'settings.updateIncome': 'Actualizar Ingresos',
  'settings.data': 'DATOS',
  'settings.manageCategories': 'Gestionar categorías',
  'settings.categoriesCount': '{{count}} categorías',
  'settings.general': 'GENERAL',
  'settings.appearance': 'Apariencia',
  'settings.light': 'Claro',
  'settings.currency': 'Moneda',
  'settings.language': 'Idioma',
  'settings.notifications': 'Notificaciones',
  'settings.notificationTime': 'Hora de notificación',
  'settings.enableNotifications': 'Habilitar notificaciones en Ajustes del sistema',
  'settings.version': 'Drip v1.0 · Rastrea lo que pagas con tu tiempo',

  // Calendar / Timeline
  'calendar.title': 'Cronología',
  'calendar.nextUp': 'PRÓXIMO',
  'calendar.daysLeft_one': '{{count}} día restante',
  'calendar.daysLeft_other': '{{count}} días restantes',
  'calendar.proTitle': 'Desbloquear Insights Pro',
  'calendar.proDesc': 'Ve todos los cobros próximos, resúmenes mensuales y actividad completa.',
  'calendar.upgrade': 'Obtener Pro',

  // Insights
  'insights.title': 'Análisis',
  'insights.categoryBreakdown': 'DESGLOSE POR CATEGORÍA',
  'insights.subsPercent': '{{pct}} subs',
  'insights.incomePercent': '{{pct}} de ingresos',

  // Add subscription
  'addSub.title': 'Añadir Suscripción',
  'addSub.searchPlaceholder': 'Buscar suscripciones...',
  'addSub.popularServices': 'Servicios Populares',
  'addSub.noResults': 'Sin resultados para "{{query}}"',
  'addSub.addCustom': 'Añadir suscripción personalizada',
  'addSub.name': 'NOMBRE',
  'addSub.priceBilling': 'PRECIO Y CICLO DE FACTURACIÓN',
  'addSub.category': 'CATEGORÍA',
  'addSub.startDate': 'FECHA DE INICIO',
  'addSub.billsOnDate': 'Se cobra en esta fecha cada ciclo',
  'addSub.iconColor': 'ÍCONO Y COLOR',
  'addSub.tapToChange': 'Toca para cambiar ícono o color',
  'addSub.freeTrial': 'Prueba gratuita',
  'addSub.trialReminder': 'Recibe un aviso antes del cobro',
  'addSub.trialLength': 'DURACIÓN DE LA PRUEBA',
  'addSub.custom': 'Personalizado',
  'addSub.reminder': 'RECORDATORIO',
  'addSub.addTrial': 'Añadir prueba',
  'addSub.addSubscription': 'Añadir suscripción',

  // Edit subscription
  'editSub.title': 'Editar Suscripción',
  'editSub.saveChanges': 'Guardar cambios',
  'editSub.remove': 'Eliminar',
  'editSub.confirmRemoveTitle': 'Eliminar suscripción',
  'editSub.confirmRemoveMessage': '¿Estás seguro de que deseas eliminar {{name}}?',
  'editSub.active': 'Activo',
  'editSub.toggleCancel': 'Desactiva para cancelar',

  // Billing cycles
  'billing.everyWeek': 'Cada semana',
  'billing.every2Weeks': 'Cada 2 semanas',
  'billing.everyMonth': 'Cada mes',
  'billing.every3Months': 'Cada 3 meses',
  'billing.every6Months': 'Cada 6 meses',
  'billing.everyYear': 'Cada año',
  'billing.custom': 'Personalizado...',

  // Cycle labels (for SubRow display)
  'cycle.weekly': 'semanal',
  'cycle.biweekly': 'quincenal',
  'cycle.monthly': 'mensual',
  'cycle.quarterly': 'trimestral',
  'cycle.biannual': 'cada 6 meses',
  'cycle.yearly': 'anual',
  'cycle.custom': 'cada {{num}} {{unit}}',

  // Reminders
  'reminder.never': 'Nunca',
  'reminder.1day': '1 día antes',
  'reminder.2days': '2 días antes',
  'reminder.3days': '3 días antes',
  'reminder.7days': '7 días antes',

  // Income
  'income.addIncome': 'Añadir Ingresos',
  'income.updateIncome': 'Actualizar Ingresos',
  'income.type': 'TIPO',
  'income.annualSalary': 'Salario Anual',
  'income.hourlyRate': 'Tarifa por Hora',
  'income.annualSalaryLabel': 'SALARIO ANUAL',
  'income.hourlyRateLabel': 'TARIFA POR HORA',
  'income.hoursPerWeek': 'HORAS POR SEMANA',
  'income.calculateRate': 'Calcular tarifa por hora',

  // Trial
  'trial.endsIn_one': 'La prueba termina en {{count}} día',
  'trial.endsIn_other': 'La prueba termina en {{count}} días',
  'trial.keepSubscription': 'Mantener suscripción',
  'trial.cancelSubscription': 'Cancelar suscripción',

  // Categories
  'categories.title': 'Categorías',
  'categories.addCategory': '+ Añadir categoría',
  'categories.deleteTitle': '¿Eliminar categoría?',
  'categories.deleteMsg_one': '{{count}} suscripción se moverá a "{{name}}"',
  'categories.deleteMsg_other': '{{count}} suscripciones se moverán a "{{name}}"',
  'categories.subsCount': '{{count}} suscripciones',

  // Budget health
  'budget.title': 'SALUD DEL PRESUPUESTO',
  'budget.ofIncome': '% de ingresos',
  'budget.healthy': 'Saludable',
  'budget.moderate': 'Moderado',
  'budget.high': 'Alto',
  'budget.alert': 'Alerta',
  'budget.setIncome': 'Establecer ingresos',

  // Income CTA
  'incomeCta.message': 'Establece tus ingresos para ver costos en horas de trabajo',

  // Summary
  'summary.title': 'RESUMEN',
  'summary.activeSubs': '{{count}} subs activas',

  // Default categories
  'categoryDefaults.entertainment': 'Entretenimiento',
  'categoryDefaults.productivity': 'Productividad',
  'categoryDefaults.health': 'Salud',
  'categoryDefaults.finance': 'Finanzas',
  'categoryDefaults.education': 'Educación',
  'categoryDefaults.other': 'Otro',

  // SubRow
  'subRow.trial': 'Prueba',
  'subRow.daysLeft': '{{count}}d restantes',
  'subRow.wasCost': 'era {{cost}}',
  'subRow.trialEnded': 'Prueba terminada',

  // Upcoming charge
  'upcoming.tomorrow': 'Mañana',
  'upcoming.days': '{{count}} días',
  'upcoming.daysShort': '{{count}}d',

  // Appearance modal
  'appearance.title': 'Apariencia',
  'appearance.preview': 'Vista previa',
  'appearance.emoji': 'Emoji',
  'appearance.icons': 'Íconos',
  'appearance.color': 'Color',
  'appearance.subscription': 'Suscripción',

  // Currency sheet
  'currencySheet.title': 'Moneda',
  'currencySheet.search': 'Buscar monedas...',

  // Time formatting
  'time.today': 'Hoy',
  'time.dayLeft': '1 día restante',
  'time.daysLeft': '{{count}} días restantes',
  'time.monthLeft': '{{count}} mes restante',
  'time.monthsLeft': '{{count}} meses restantes',
  'time.yearLeft': '{{count}} año restante',
  'time.h': 'h',
  'time.m': 'm',
  'time.min': 'min',

  // Time tiers
  'tier.extreme': 'Extremo',
  'tier.veryHigh': 'Muy Alto',
  'tier.high': 'Alto',
  'tier.moderate': 'Moderado',
  'tier.low': 'Bajo',
  'tier.minimal': 'Mínimo',

  // Language
  'language.title': 'Idioma',
  'language.auto': 'Automático (Sistema)',

  // Lifetime cost
  'lifetime.title': 'COSTO ACUMULADO',
  'lifetime.sinceTracked': 'Desde el primer registro',
  'lifetime.thisMonth': 'Este mes',
  'lifetime.since': 'Desde {{month}} · {{count}} meses',
  'lifetime.months': '{{count}} meses',
  'lifetime.allTime': 'Total histórico:',

  // Activity
  'activity.title': 'ACTIVIDAD',
  'activity.noChanges': 'Sin cambios este mes',
  'activity.added': 'Añadido',
  'activity.cancelled': 'Cancelado',
  'activity.reactivated': 'Reactivado',
  'activity.priceChange': 'precio → {{cost}}',
  'activity.cycleChange': 'ciclo cambiado',

  // Spending trend
  'spending.title': 'TENDENCIA DE GASTO',
  'spending.empty': 'Tu tendencia de gasto aparecerá después del primer mes.',
  'spending.vsLastMonth': 'vs mes anterior',

  // Breakdown
  'breakdown.title': 'DESGLOSE DE {{month}}',
  'breakdown.other': 'Otro',

  // Pro / Paywall
  'pro.badge': 'PRO',
  'pro.unlockPro': 'Desbloquear Drip Pro',
  'pro.priceOnce': 'Desbloquear por {{price}}',
  'pro.ctaButton': 'Desbloquear Pro',
  'pro.restorePurchase': 'Restaurar compra',
  'pro.notNow': 'Ahora no',
  'pro.unlocked': 'Pro — Desbloqueado',
  'pro.upgradeToPro': 'Mejorar a Pro',
  'pro.upgradePrice': '$4',
  'pro.purchaseSuccess': '¡Bienvenido a Drip Pro!',
  'pro.restoreSuccess': '¡Compra restaurada!',
  'pro.restoreNone': 'No se encontró ninguna compra anterior',
  'pro.headline.subs': 'Rastrea todas tus suscripciones',
  'pro.desc.subs': 'Elimina el límite de 2 suscripciones y rastrea cada servicio que pagas.',
  'pro.headline.customSub': 'Suscripciones Personalizadas',
  'pro.desc.customSub': 'Mejora a Pro para crear suscripciones a medida que no están en nuestra lista.',
  'pro.headline.insights': 'Ve tus tendencias de gastos',
  'pro.desc.insights': 'Desbloquea el historial completo de gastos, desglose por categoría y costos de por vida.',
  'pro.headline.calendar': 'No te pierdas una renovación',
  'pro.desc.calendar': 'Ve tu línea de tiempo completa de renovaciones.',
  'pro.headline.trial': 'Controla tus pruebas',
  'pro.desc.trial': 'Rastrea pruebas gratuitas y recibe recordatorios antes de que empiecen a cobrar.',
  'pro.headline.categories': 'Personaliza tus categorías',
  'pro.desc.categories': 'Personaliza iconos, colores y orden de categorías.',
  'pro.feature.unlimitedSubs': 'Suscripciones ilimitadas',
  'pro.feature.fullInsights': 'Análisis y tendencias completas',
  'pro.feature.fullCalendar': 'Calendario completo de renovaciones',
  'pro.feature.trialTracking': 'Seguimiento de pruebas y recordatorios',
  'pro.feature.customCategories': 'Categorías personalizadas',
  'pro.subLimitHint': 'Añade más con Pro',

  // Onboarding
  'onboarding.headline': 'Descubre lo que cuestan realmente tus suscripciones',
  'onboarding.headlineAccent': '— en horas de tu trabajo',
  'onboarding.subtitle': 'Drip convierte cada suscripción en las horas de trabajo que necesitas para pagarla.',
  'onboarding.getStarted': 'Comenzar',
  'onboarding.continue': 'Continuar',
  'onboarding.skip': 'Omitir',
  'onboarding.incomeQuestion': '¿Cuál es tu ingreso mensual?',
  'onboarding.incomeHint': 'Esto nos ayuda a calcular cuántas horas trabajas por cada suscripción.',
  'onboarding.feature.calendar': 'Calendario de renovaciones',
  'onboarding.feature.calendarDesc': 'No te pierdas una renovación — ve cada cargo próximo de un vistazo.',
  'onboarding.feature.insights': 'Análisis de gastos',
  'onboarding.feature.insightsDesc': 'Rastrea tendencias de gastos y ve a dónde va tu dinero.',
  'onboarding.feature.trials': 'Seguimiento de pruebas',
  'onboarding.feature.trialsDesc': 'Controla las pruebas gratuitas antes de que empiecen a cobrar.',
};

export default es;
