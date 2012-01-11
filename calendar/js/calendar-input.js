var calendar = function() {

	var refById   = function(id) {return document.getElementById(id);},
		drawDate  = new Date(), delimeter = ':', cal = null;
	
	var overlay, container, btnNextMonth,btnPreMonth,
		btnPreYear,btnNextYear,btnNextMinu,btnPreMinu,btnNextHour,
		btnPreHour,boxTime,divDateInfo;
		
	var Time = {
		set: function(o) {
			return {  h: Time.pad(o.h>23 ? 0 : o.h<0 ? 23 : o.h), m: Time.pad(o.m>59 ? 0 : o.m<0 ? 59 : o.m) }
		},
		fix: function(o) {
			var hour = o.h, minute = o.m,
				m = Math.floor(minute/60), h = Math.floor((hour+m)/24),
				x = minute % 60, y=(hour+m) % 24;
			return { d: h, h: Time.pad(y), m: Time.pad(x) };
		},
		get: function(v) {
			var time = (v||'').split(delimeter), hour = Math.abs(parseInt(time[0], 10)||0),
				minute = Math.abs(parseInt(time[1], 10)||0);
			return { h: hour, m: minute };
		},
		pad: function(v) {
			return (v+'').length==1 ? '0'+v : v+'';
		},
		parse: function(d) {
			d = d || new Date();
			return { h: Time.pad(d.getHours()), m: Time.pad(d.getMinutes())	};
		}
	};
	var timeAdjust = function(h, m, fix) {
		var o = Time.get(boxTime.value); (h!=null) && (o.h+=h); (m!=null) && (o.m+=m);
		o = (fix ? Time.fix(o) : Time.set(o));
		boxTime.value = [o.h,o.m].join(delimeter);
	};
	return {
		instance: cal, textbox: null,
		bindToClass: '_calendar-date', Time: Time,
		selectedDate: null,
		initialize: function(options) {
			Object.mix(this, options, true);
			calendar.insertHTMLs();
			calendar.initRef();
			calendar.initEvents();
			calendar.bind();
		},
		initRef: function() {				
			overlay      = refById('cal-overlay');
			container    = refById('cal-wrap');
			btnNextMonth = refById('cal-next-month');
			btnPreMonth  = refById('cal-pre-month');
			btnPreYear   = refById('cal-pre-year');
			btnNextYear  = refById('cal-next-year');
			btnNextMinu  = refById('cal-next-minu');
			btnPreMinu   = refById('cal-pre-minu');
			btnNextHour  = refById('cal-next-hour');
			btnPreHour   = refById('cal-pre-hour');
			boxTime      = refById('cal-box-time');
			divDateInfo  = refById('cal-date-info');
			cal = new MonthlyCalendar({
				'container': container, 'displayDays': ['日','一','二','三','四','五','六'],
				'onchange': function(args) { divDateInfo.innerHTML = cal.getCurrentDate().format(); }
			});
		},
		initEvents: function() {
			btnNextYear.onclick  = function() { cal.drawNextYear();      };
			btnPreYear.onclick   = function() { cal.drawPreviousYear();  };
			btnNextMonth.onclick = function() { cal.drawNextMonth();     };
			btnPreMonth.onclick  = function() { cal.drawPreviousMonth(); };
			btnPreMinu.onclick   = function() { timeAdjust(null, -1);     };
			btnNextMinu.onclick  = function() { timeAdjust(null, 1);      };
			btnPreHour.onclick   = function() { timeAdjust(-1, null);     };
			btnNextHour.onclick  = function() { timeAdjust(1, null);      };
			boxTime.onblur       = function() { timeAdjust(null, null, true); }
			cal.on('select', function(args) {
				calendar.textbox.value = args.date+ ' ' +boxTime.value+':00';
				divDateInfo.innerHTML = calendar.selectedDate = args.date;
				calendar.hide();
			});
			cal.on('drawing', function(args) {
				if (calendar.selectedDate && calendar.selectedDate==args.date.format()) {
					dom.addClass(args.cell, 'highlight');
				}
			});
		},
		insertHTMLs: function() {
			var htmls = '\
		  		<div id="cal-overlay">\
				  	<div id="calendar-op">\
				  		<a href="javascript:;" title="上一年" id="cal-pre-year">&lt;&lt;</a>&nbsp;&nbsp;\
				  		<a href="javascript:;" title="上一月" id="cal-pre-month">&lt;</a>\
				  		&nbsp;&nbsp;<span id="cal-date-info">loading...</span>&nbsp;&nbsp;\
				  		<a href="javascript:;" title="下一月" id="cal-next-month">&gt;</a>&nbsp;&nbsp;\
				  		<a href="javascript:;" title="下一年" id="cal-next-year">&gt;&gt;</a>\
				  	</div>\
					<div id="cal-wrap">loading...</div>\
					<div id="cal-time">\
				  		<a href="javascript:;" title="上一小时" id="cal-pre-hour">&lt;&lt;</a>&nbsp;&nbsp;\
				  		<a href="javascript:;" title="上一分钟" id="cal-pre-minu">&lt;</a>\
						<input id="cal-box-time" style="width:35px" value="">\
				  		<a href="javascript:;" title="下一分钟" id="cal-next-minu">&gt;</a>&nbsp;&nbsp;\
				  		<a href="javascript:;" title="下一小时" id="cal-next-hour">&gt;&gt;</a>\
					</div>\
				</div>';
			var css = '\
				#cal-overlay { width:180px;position:absolute;display:none;font-size:12px;font-family:arial;text-align:center; cursor:default;}\
				#cal-wrap .calendar-header {background:#BCA260;}\
				#cal-wrap .calendar-day { color:#FAEAC6;font-weight:normal;height:25px;}\
				#cal-wrap .calendar-header .day-sunday,\
				#cal-wrap .calendar-header .day-saturday {color:#fff;}\
				#cal-wrap table {border-collapse:collapse;width:100%;}\
				#cal-wrap .calendar-date {border-left:1px solid #BCA26F;padding:3px;height:12px;color:#8E6412;text-align:center;}\
				#cal-wrap .day-sunday,\
				#cal-wrap .day-saturday {color:#fff;}\
				#cal-wrap .date-sunday {border:0}\
				#cal-wrap .calendar-date {background:#FAEAC6;}\
				#cal-wrap .calendar-not-the-month {background:#FAEAC6;color:#F5D081;}\
				#cal-wrap .calendar-today {background:#FFF5DB;}\
				#cal-wrap .highlight {background:#fff;}\
				#cal-wrap .calendar-hover {background:#FFF5DB;}\
				#cal-wrap .calendar-invalid {background:#FAEAC6;text-decoration: line-through;}\
				#calendar-op {color:#fff;background:#FAEAC6;padding:3px;color:#000}\
				#calendar-op a {text-decoration:none;color:#000;}\
				#cal-time {background:#BCA26F;}\
				#cal-time a {color:#000;text-decoration:none;}';
			var style = document.createElement('style');
			style.type = 'text/css';
			style.styleSheet ? style.styleSheet.cssText = css :
			style.appendChild(document.createTextNode(css));
			document.getElementsByTagName('head')[0].appendChild(style);
			var wrap = document.createElement('div');
			document.body.appendChild(wrap);
			wrap.innerHTML = htmls;
		},
		bind: function() {
			var nodes = dom.getElementsByClassName(calendar.bindToClass);
			for (var i=0, l=nodes.length; i<l; i++) {
				nodes[i].onfocus = (function(i) {
					return function() {
						var el = nodes[i]; calendar.setDate(el.value);
						var o = Time.parse(drawDate),
							min = el.getAttribute('data-min-date'),
							max = el.getAttribute('data-max-date');
						boxTime.value = [o.h, o.m].join(delimeter);
						min && (cal.minDate = parseDate(min));
						max && (cal.maxDate = parseDate(max));
						cal.draw(drawDate);
						calendar.textbox = el;
						calendar.show(el);
					}
				})(i);
				nodes[i].onblur = function(e) {};
			}
			var fn = function(e) {
				var target = eventH.target(e);
				if (dom.contains(overlay,target) || calendar.textbox==target) return;
				calendar.hide();
			};
			eventTargetH.on(document, 'click', fn);
			eventTargetH.on(document, 'keyup', fn);
		},
		show: function(el) {
			var o = dom.getOffsets(el);
			overlay.style.display = 'block'; overlay.style.position = 'absolute';
			overlay.style.top = (o.top+el.offsetHeight) +'px'; overlay.style.left = (o.left) +'px';
		},
		hide: function() {
			overlay.style.display = 'none';
		},
		setDate: function(date) {
			date = date || new Date();
			if (typeof date == 'string') {
				drawDate = parseDate(date);
				drawDate = (drawDate.toString()=='Invalid Date'||isNaN(drawDate) ? new Date() : drawDate);
			}  else { drawDate = date }
			return drawDate;
		}
	
	}
}();