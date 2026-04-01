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
};

export default es;
