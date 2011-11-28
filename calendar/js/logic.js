		//只是singlton,其实是可以作为class的,
		//这样可以调整任意的calendar view
		var CalendarView = {
			mainbaseCls   : 'calendar-base-class',
			mainAdjustCls : 'calendar-base-rows6',
			calendar      : null,
			adjustRows    : 6,
			initialize    : function(cal) {
				//6行与5行的高度设置不一样
				this.calendar = cal;
				//在beforedraw事件时去为日历设置特定的className
				CalendarView.calendar.on('beforedraw', function(args) {
					var cls = CalendarView.mainbaseCls;
					if (CalendarView.adjustRows==CalendarView.calendar.displayRows) { 
						cls = CalendarView.mainAdjustCls; 
					}
					CalendarView.calendar.baseClass = cls;
				});
			}
		};
		
		//获取数据的接口,不耦合在logic里是使得
		//model里的代码得以复用在其他地方
		var CalendarModel = {
			initialize: function() {
			}
		};
			
		var CalendarLogic = {
		
			minical  : null,
			maincal  : null,
			drawDate : new Date(),
			view     : null,
			model    : null,
		
			initialize: function() {
				this.initCalendarInstance();
				this.initEvents();
				this.initView();
				this.initModel();
				this.minical.draw(this.drawDate);
				this.maincal.draw(this.drawDate);
			},
			
			setView: function(view) {
				CalendarLogic.view = view;
			},
			
			setModel: function(model) {
				this.model = model;
			},
			
			initView: function() {
				this.view.initialize(this.maincal);
			},
			
			initModel: function() {
				this.model.initialize();
			},
			
			initEvents: function() {
				//为一些button添加事件
				refById('maincal-next').onclick  = function() { CalendarLogic.maincal.drawNextMonth(); }
				refById('maincal-pre').onclick   = function() { CalendarLogic.maincal.drawPreviousMonth(); }
				refById('maincal-today').onclick = function() { CalendarLogic.maincal.draw(new Date()); }
				refById('minical-next').onclick  = function() { CalendarLogic.minical.drawNextMonth(); }
				refById('minical-pre').onclick   = function() { CalendarLogic.minical.drawPreviousMonth(); }
				
				//小日历日期更改需要同步到信息中
				CalendarLogic.minical.on('change', function(args) {
					refById('minical-date-info').innerHTML = args.currentDate.format('yyyy年MM月');
				});
	
				//主日历改了之后小日历也需要跟着主日历日期走
				CalendarLogic.maincal.on('change', function(args) {
					CalendarLogic.minical.draw(args.currentDate);
					refById('maincal-date-info').innerHTML = args.currentDate.format('yyyy年MM月');
					location.hash=args.currentDate.format();
				});
				//点击之后是可以编辑的
				CalendarLogic.maincal.on('select', function(args) {
					alert(args.date);
				});
			},
			
			//从真正意义上的mvc来看
			//这里的minical与maincal都是关联的关系,即是在外部实例化后再传后
			//而在logic里进行实例化,则变成了强关系
			//不过对于一般的应用,也无所谓
			initCalendarInstance: function() {
				this.minical = new MonthlyCalendar({
					'container'   : refById('minical'), 
					'displayDays' : ['日','一','二','三','四','五','六'],
					'onselect'    : function(args) { this.draw(parseDate(args.date)); }
				});
				this.maincal = new MonthlyCalendar({
					container:refById('maincal')
				});
			}
		};
		
		//做得干净点
		icalendar = {
			initialize: function() {
	  			//这里设置一下使用关系
	  			var hashDate = location.hash.slice(1);
	  			CalendarLogic.drawDate = parseDate(hashDate);
	  			CalendarLogic.setView(CalendarView);
	  			CalendarLogic.setModel(CalendarModel);
				CalendarLogic.initialize();
			}
		};