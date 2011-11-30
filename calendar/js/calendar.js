/**
 * @fileoverview calendar.js
 * @author:{@link mailto:ranklau@gmail.com rank}
 * @last-modified : 2011-8-8
 */
(function () {


	/* Adapter代码, 如果你的框架中有此代码,请替换即可 */

		eventH.target   = eventH.target;
		dom.contains    = dom.contains;
		dom.create      = dom.create;
		dom.outerHTML   = dom.outerHTML;
		classH.extend   = classH.extend;
		eventTargetH.on = eventTargetH.on;
		ce              = CustEvent;
		mix             = Object.mix;
		parseDate       = parseDate;
		formatDate      = formatDate;
		log             = log;
	
	/* Adpater代码结束 */
	
	
	var Guid   = 0,
		calPrefix = 'icalendar-',
		now    = new Date();

	var _selectEvents = 'select', 						//选定日期的事件
		_drawEvents   = 'beforedraw,drawing,afterdraw',	//建立日期时的事件,可以用于填充数据
		_baseEvents   = 'cellin,cellout',			//单元格的cellin/mouseout
		_changeEvents = 'change,outofdate',            //日历改变时事件
		_uiEvents     = 'beforeshow,show,aftershow,beforehide,hide,afterhide';
	
	/**
	 * @class VitualBaseCalendar 虚日历,包括部分实现
	 * @remarks
	 */
	function VitualBaseCalendar(options) {
		return this._initialize.apply(this, arguments);
	};

	Object.mix(VitualBaseCalendar.prototype, {
	
		/**
		 * @property 装载日历用的容器
		 * @type {HTMLElement}
		 */
		container: null,
		
		/**
		 * @property 当前的日期对象
		 * @type {Date}
		 */
		currentDate: new Date(),
		
		/**
		 * @property 允许的最小日期
		 * @type {Date}
		 */
		minDate: new Date(now.getFullYear()-2, now.getMonth(), now.getDate()),
		
		/**
		 * @property 允许的最大日期
		 * @type {Date}
		 */
		maxDate: new Date(now.getFullYear()+2, now.getMonth(), now.getDate()),
		
		/**
		 * @property 一个日历实例的UID
		 * @type {Number}
		 */
		uid: null,
		
		/**
		 * @property 最后一次绘制的日期
		 * @type {Date}
		 */
		lastDrawDate: null,
		
		/**
		 * @property 绘制日期是否越界
		 * @type {Boolean}
		 */
		isDateOutOfRange: false,
		
		/**
		 * @property 指示是否已经初始化事件
		 * @type {Boolean}
		 * @private
		 */
		_initEvents: false,
		

		_initialize: function(options) {
			Guid = Guid + 1;
			this.uid = Guid;
			Object.mix(this, options||{}, true);

			ce.createEvents(this, _selectEvents);
			ce.createEvents(this, _drawEvents);
			ce.createEvents(this, _baseEvents);
			ce.createEvents(this, _changeEvents);
			ce.createEvents(this, _uiEvents);
		
			//由使用者自己实现dispose并自己调用
			
			return this;
		},
		
		dispose: function() {},

		/**
		 * 得到当前的Date日期对象
		 * @return {Date} 返回当前的日期对象
		 */
		getCurrentDate: function() {
			return this.currentDate;
		},
		
		/**
		 * 设置当前日历的日期
		 * @param {Date} 要设置的日期对象
		 * @return {Date} 返回当前的日期对象
		 */
		setCurrentDate: function(oDate) {
			//TODO instanceof Date
			if (!oDate) {
				throw new Error(['Calendar', 'setCurrentDate', 'setCurrentDate arguments oDate is not a Date type']);
			}
			this.currentDate = oDate;
		},
		
		/**
		 * 设置日历的容器
		 * @param {HTMLElement} 容器的HTMLElement
		 * @return void
		 */
		setContainer: function(container) {
			//TODO isHTMLELement
			if (!container) {
				throw new Error(['Calendar', 'setContainer', 'setContainer arguments container is not a HTMLELement']);
			}
			this.container = container;
		},

		/**
		 * 格式化日期
		 * @param {Date} d 日期对象
		 * @param {String} pattner 格式化字符串
		 * @return {String} 返回以pattern格式处理的日期字符串
		 * @remark DateH里也有format方法,cp放在这里备忘吧
		 */
		formatDate: function(d, pattern) {
	       return formatDate.apply(this, arguments);
		},
		
		parseDate: function(source) {
		    return parseDate.apply(this, arguments);
		}

	});
	


	/**
	 * @class MonthlyCalendar 继承并实现了接口的月日历
	 * @remarks
	 */
	var MonthlyCalendar = classH.extend(function() {
		arguments.callee.$super.apply(this, arguments);
		return this._init.apply(this, arguments);
	}, VitualBaseCalendar, false);

	mix(MonthlyCalendar.prototype, {
	
		/**
		 * @property 月模式的表头开始是星期几,参见displayDays属性的数组以对应下标
		 * @seealso {displayDays}
		 * @type {Number}
		 */
		initDayIndex: 0,
		
		/**
		 * @property 以月为模式展示的日期行数
		 * @type {Number}
		 */
		displayRows: 5,
		
		/**
		 * @property 用于展示月份的文本
		 * @type {Array}
		 */
		displayMonths: ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'],
		
		/**
		 * @property 用于展示星期的文本
		 * @type {Array}
		 */
		displayDays: ['周日','周一','周二','周三','周四','周五','周六'],
		

		/**
		 * @property 绘制当前展现的第一天的日期
		 * @type {Boolean}
		 */
		startDate: null,
		
		/**
		 * @property 绘制本月的最后一天日期
		 * @type {Boolean}
		 */
		endDate: null,
		
		/**
		 * @property 自动设定参数,displayRows为5还是6
		 * @type {Boolean}
		 */
		autoRows: true,

		/**
		 * @property 是否显示表头
		 * @type {Boolean}
		 */
		displayHeader: true,
		
		/**
		 * @property 基本的className样式名
		 * @type {String}
		 */
		baseClass: 'calendar-base-class',
		
		/**
		 * @property 样式名
		 * @type {JSON}
		 */
		className: {
			days:  ['day-sunday calendar-day', 
					'day-monday calendar-day', 
					'day-tuesday calendar-day', 
					'day-wednesday calendar-day', 
					'day-thursday calendar-day', 
					'day-friday calendar-day', 
					'day-saturday calendar-day'],

			dates: ['date-sunday calendar-date', 
					'date-monday calendar-date', 
					'date-tuesday calendar-date', 
					'date-wednesday calendar-date', 
					'date-thursday calendar-date', 
					'date-friday calendar-date', 
					'date-saturday calendar-date'],
			header     : 'calendar-header',
			today      : 'calendar-today',
			invalid    : 'calendar-invalid',
			notTheMonth: 'calendar-not-the-month',
			hover      : 'calendar-hover'
		},
		
		/**
		 * @property 日历的第一天位置
		 * @readonly
		 * @type {Number}
		 */
		firstDayOffset: 1,
		
		_init: function() {
			var self = this;
			self.on('drawing', function(args) {
				var cell    = args.cell, 
					oDate   = args.date, 
					current = self.getCurrentDate();
					
				if (oDate.getMonth()!=current.getMonth()) { 
					dom.addClass(cell, self.className.notTheMonth);
				}
				if (oDate.format()==new Date().format()) {
					dom.addClass(cell, self.className.today);
				}
				if (self.checkDateOutOfRange(oDate)) {
					dom.addClass(cell, self.className.invalid);
				}
			});
			
			self.on('cellin', function(args) {
				dom.addClass(args.cell, self.className.hover);
			});
			
			self.on('cellout', function(args) {
				dom.removeClass(args.cell, self.className.hover);
			});
			
		},
	
		/**
		 * 给每个日历实例绑定一个委托事件
		 * 包括选中日历,mouseover,mouseout等
		 * @return void
		 */
		bindEvents: function() {
		
			if (this._initEvents) return;
			
			var self        = this,
				container   = this.container,
				lastCell    = null;
			
			//回朔找到单元格
			var getDateCell = function(el) {
				if (el && el.getAttribute && el.getAttribute('data-icalendar')) {
					return el;
				}
				while (el = el.parentNode) {
					if (el && el.getAttribute && el.getAttribute('data-icalendar')) {
						return el;
					}
				}
				return null;
			};
			
			eventTargetH.on(container, 'click', function(e) {
				var target = eventH.target(e), data, arg;
				
				//需要为每个实例建立自己的select事件
				if (target && dom.contains(container, target)) {
					target = getDateCell(target);
					
					//理论上target不应该出现null,如果出现null则说明data-icalendar的属性存入时有问题
					data = target.getAttribute('data-icalendar'),
					arg  = { 'cell': target, 'date': data };
					
					self.fire('select', arg);
				}
			});
			
			//mouseover委托,委托在calendar的table上
			//自己实现一个mouseout和mouseover的自定义事件
			eventTargetH.on(container, 'mouseover', function(e) {
				
				var target = eventH.target(e),
					mouseoverArgs, mouseoutArgs, data;
				
				//获取单元格
				target = getDateCell(target);
				
				//当前单元格 就是 最后一次单元格 则退出
				if (target==lastCell) {
					return;
				}
				
				if (target && dom.contains(container, target)) {
					
					data          = target.getAttribute('data-icalendar');
					mouseoverArgs = { 'cell': target, 'date': data };

					self.fire('cellin', mouseoverArgs);
					
					if (lastCell) {
						mouseoutArgs = { 'cell': lastCell, 
										 'date': lastCell.getAttribute('data-icalendar') };
						self.fire('cellout', mouseoutArgs);
					}
					
					lastCell = target;
					
				}
				
			});
			
			eventTargetH.on(container, 'mouseleave', function(e) {
				if (lastCell) {
					mouseoutArgs = { 'cell': lastCell, 
									 'date': lastCell.getAttribute('data-icalendar') };
					self.fire('cellout', mouseoutArgs);
					lastCell = null;
				}
			});
			
			this._initEvents = true;
		},
		
		/**
		 * 检测日期是否在日历类里的minDate与maxDate范围之内
		 * @param {Date} 要检测的日期
		 * @return {Boolean} 如果没有越界返回false,否则返回true
		 * @remark 判断的方法比较简单,format成浮点数(如果有分钟和秒的话),再判断大小即可
		 */
		checkDateOutOfRange: function(oDate) {
			oDate = oDate || this.currentDate;
			if (Object.prototype.toString.call(oDate)!='[object Date]') {
				throw new Error(['Calendar', 'checkDateOutOfRange', 'checkDateOutOfRange arguments oDate[' +oDate+ '] is not Date instance.']);
			}
			
			var result  = false,
				tmpDate = parseFloat(oDate.format('yyyyMMdd'),10),
				maxDate = parseFloat(this.maxDate.format('yyyyMMdd'),10),
				minDate = parseFloat(this.minDate.format('yyyyMMdd'),10);
				
			if (tmpDate > maxDate || tmpDate < minDate) { 
				result = true; 
			}
			
			//log('isDateOutOfRange: ' +result+ ', maxDate is:' +maxDate);
			this.isDateOutOfRange = result;
			return result;
		
		},
	
		/**
		 * 月模式建立一个一周的表头
		 * @param void 
		 * @return {String} 返回用table建成的HTML串
		 */
		buildHeader: function(table) {
			var cols         = this.displayDays.length,
				className    = this.className.days,
				dispName     = this.displayDays,
				initDayIndex = this.initDayIndex;
			
			var	tr     = table.insertRow(table.rows.length),
				th;
			
			tr.className = this.className.header;
			
			for (var i=0; i<cols; i++) {
				var dayIndex = (i + initDayIndex) % cols;
				
				th = document.createElement('th');
				tr.appendChild(th);
				th.className = className[dayIndex];
				th.innerHTML = dispName[dayIndex];
			}
			//留一个给未来绘制表头的事件, drawhead
			return table;
		},
		
		fixedDisplayRows: function() {
			this.displayRows = parseInt(this.displayRows, 10);
			if (this.autoRows) {
				this.setAutoDisplayRows();
			}
		},
		
		/**
		 * 建立一个按月模式的日历内容
		 * @param {Date} oDate 以此日期对象建立一个日历内容
		 * @return {String} 返回用table建成的HTML串
		 */
		buildBody: function(oDate) {
		
			oDate = oDate || this.currentDate;
			
			var header = '<table cellpadding="0" cellspacing="0" class="' +this.baseClass+ '" id="' +calPrefix+this.uid+ '"><tbody>',
				footer = '</tbody></table>',
				table, tr, td;
			
			var self      = this;
			    cols      = this.displayDays.length,
				rows      = this.displayRows,
				className = this.className.dates;
			
			var year  = oDate.getFullYear(),
				month = oDate.getMonth(),
				date  = oDate.getDate(),
				day   = oDate.getDay();
			
			//算出倒退几天的数量,负数表示
			//用new Date(year, month, date), date可以为负数
			//负数表示递推至上一个月, 这个接口比较给力.
			var startDate = (-this.firstDayOffset)+1;
			
			//生成临时日期, 每个td单元格的自定义属性数据
			var tmpDate = null, 
				tmpData = null,
				tmpDayIndex  = null,
				tmpClassName = null,
				args;
			
			
			//dom.create里面是有bug的,不能创建tr,td等非display为block/inline的元素
			//td的display属性为displayCell
			//TODO 待修正Dom.create
			table = dom.create(header+footer);
			if (this.displayHeader) this.buildHeader(table);
			
			this.startDate = new Date(year, month, startDate);
			
			for (var i=0, len=rows*cols; i<len; i++) {
			
				if (0 == i%cols) {
					tr = table.insertRow(table.rows.length);
				}
				
				tmpDate = new Date(year, month, startDate+i);
				tmpData = this.formatDate(tmpDate);
				tmpDayIndex = (tmpDate.getDay() + this.initDayIndex) % cols;
				tmpClassName = className[tmpDayIndex];
				
				td = tr.insertCell(tr.cells.length);
				td.className = tmpClassName;
				td.innerHTML = tmpDate.getDate();
				td.setAttribute('data-icalendar', tmpData);

				args = { 'cell': td, 'date': tmpDate };
				this.fire('drawing', args);
			}
			
			this.endDate = tmpDate;

			return table;
		},
		
		/**
		 * 自动设置日历的行数
		 * @param {Date} oDate 以此日期对象建立一个日历内容
		 * @return {Number} 返回是以5行或者是6行来显示日历
		 */
		setAutoDisplayRows: function(oDate) {
			log('setAutoDisplayRows');
			oDate = oDate || this.currentDate;
			var month  = oDate.getMonth(),
				year   = oDate.getFullYear(),
				displayRows = 5;
				
			//算出是需要5行还是6行还显示日历
			//如果 第一天的位置+这个月的总天数 > 单元格的总数 则显示6行
			//否则显示5行
			var totalDisplayCells = 7*this.displayRows;
			
			//当前drawDate的这个月总天数
			var theMonthDays = new Date(year, month+1, 0).getDate();
			
			//偏移量
			var firstDayOffset = this.getDateFirstDayOffset(oDate);
	
			if ((firstDayOffset + theMonthDays) > totalDisplayCells) {
				displayRows = 6;
			} else {
				displayRows = 5;
			}
			
			return this.displayRows = displayRows;
		},
		
		/**
		 * 得到一个月日历的偏移量
		 * @param {Date} oDate 要绘制的日期
		 * @return Number
		 */
		getDateFirstDayOffset: function(oDate) {
			oDate = oDate || this.getCurrentDate();
			var cols = this.displayDays.length,
				rows = this.displayRows;
				
			var year  = oDate.getFullYear(),
				month = oDate.getMonth(),
				date  = oDate.getDate(),
				day   = oDate.getDay();
			
			//算出当前1号星期几
			var firstDay = new Date(year, month, 1).getDay();
			
			//算出1号在日历当中出现的位置,并且根据此位置算出要往前倒退几天.
			var firstDayOffset = (firstDay+cols-this.initDayIndex) % cols;
			
			return firstDayOffset;
		},
		
		getStartDate: function(oDate) {
			oDate = oDate || this.getCurrentDate();
			var firstDayOffset = this.getDateFirstDayOffset(oDate),
				startDate      = (-this.firstDayOffset)+1;
			return new Date(oDate.getFullYear(), oDate.getMonth(), startDate);
		},
		
		getEndDate: function(oDate) {
			oDate = oDate || this.getCurrentDate();
			var firstDayOffset = this.getDateFirstDayOffset(oDate),
				cols = this.displayDays.length,
				rows = this.displayRows,
				startDate = (-this.firstDayOffset)+1;
			return new Date(oDate.getFullYear(), oDate.getMonth(), startDate + cols * rows);
		},
		
		/**
		 * 将日历绘制到某个容器当中
		 * @param {Date} oDate 要绘制的日期
		 * @seealso {drawDate}
		 * @return void
		 */
		draw: function() {
			return this.drawDate.apply(this,arguments);
		},
		
		/**
		 * 将日历绘制到某个容器当中
		 * @param {Date} oDate 要绘制的日期
		 * @return void
		 */
		drawDate: function(oDate) {
			oDate = oDate || this.getCurrentDate();
			this.setCurrentDate(oDate);
			this.fixedDisplayRows();
			
			if (this.checkDateOutOfRange(oDate)===true) {
				this.fire('outofdate', {date: oDate, 
										minDate: this.minDate,
										maxDate: this.maxDate});
				//return;
			}
			
			var afterDrawArgs = beforeDrawArgs = { 'cell': null, 'date': oDate }, 
				firstDayOffset;
			
			this.firstDayOffset = this.getDateFirstDayOffset(oDate);
			log('[logging] firstDayOffset is '+ this.firstDayOffset);
			
			this.fire('beforedraw', beforeDrawArgs);
			this.container.innerHTML = this.build(oDate);
			this.bindEvents();
			
			if (oDate && this.lastDrawDate!=oDate) {
				this.fire('change', { 'currentDate': oDate, 
									'lastDate': this.lastDrawDate });
				this.lastDrawDate = oDate;
			}
			
			this.fire('afterdraw', afterDrawArgs);
			return this;

		},
		
		
		
		getCellByDate: function(oDate) {
			
		},

		/**
		 * 通过显示模式用简单工厂建立一个日历
		 * @param {Date} oDate 需要建立的一个日历对象
		 * @return {String} 返回用table建成的HTML串
		 */
		build: function(oDate) {
			//为什么要转成html,只是为了兼容draw里都采用string来处理
			//虽然用dom创建稍微慢些,但也还能接受,因为日历在一个页面里最多只出现几个实例
			var htmls = dom.outerHTML(this.buildBody(oDate));
			return htmls;
		},
		
		/**
		 * 将上一年的日历绘制到某个容器当中
		 * @return void
		 */
		drawPreviousYear: function(){
			var newDate = this.getPreviousYear();
			this.drawDate(newDate);
		},

		/**
		 * 返回上一年的日期Object
		 * @return {Date}
		 */
		getPreviousYear: function(oDate) {
			var oDate = oDate || this.getCurrentDate(),
				year  = oDate.getFullYear(),
				month = oDate.getMonth(),
				date  = oDate.getDate();
			return new Date(year-1, month, date);
		},

		/**
		 * 返回下一年的日期Object
		 * @return {Date}
		 */
		getNextYear: function(oDate) {
			var oDate = oDate || this.getCurrentDate(),
				year  = oDate.getFullYear(),
				month = oDate.getMonth(),
				date  = oDate.getDate();
			return new Date(year+1, month, date);
		},
		
		/**
		 * 返回上一月的日期Object
		 * @return {Date}
		 */
		getPreviousMonth: function(oDate) {
			var oDate = oDate || this.getCurrentDate(),
				year  = oDate.getFullYear(),
				month = oDate.getMonth(),
				date  = oDate.getDate();
			return new Date(year, month-1, date);
		},
		
		/**
		 * 返回下一月的日期Object
		 * @return {Date}
		 */
		getNextMonth: function(oDate) {
			var oDate = oDate || this.getCurrentDate(),
				year  = oDate.getFullYear(),
				month = oDate.getMonth(),
				date  = oDate.getDate();
			return new Date(year, month+1, date);
		},
		
		/**
		 * 将下一年的日历绘制到某个容器当中
		 * @return void
		 */
		drawNextYear: function(){
			var newDate = this.getNextYear();
			this.drawDate(newDate);
		},
		
		/**
		 * 将上个月的日历绘制到某个容器当中
		 * @return void
		 */
		drawPreviousMonth: function(){
			var newDate = this.getPreviousMonth();
			this.drawDate(newDate);
		},
		
		/**
		 * 将下个月日历绘制到某个容器当中
		 * @return void
		 */
		drawNextMonth: function(){
			var newDate = this.getNextMonth();
			this.drawDate(newDate);
		},
		
		/**
		 * 将今天日历绘制到某个容器当中
		 * @return void
		 */
		drawToday: function() {
			this.drawDate(new Date());
		},
		
		/**
		 * 显示日历
		 * 标准控件接口
		 * @return void
		 */
		show: function() {
			this.fire('show');
			this.container.style.display = 'block';
		},
		
		/**
		 * 隐藏日历
		 * 标准控件接口
		 * @return void
		 */
		hide: function() {
			this.fire('hide');
			this.container.style.display = 'none';
		}
	
	});
	
	
	//attach to window host
	window.VitualBaseCalendar = VitualBaseCalendar;
	window.MonthlyCalendar = MonthlyCalendar;

})();
