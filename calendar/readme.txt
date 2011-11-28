=通用日历组件=

//TODO
//在delegate cell单元格时我偷了小懒
//有一点小bug,应该不会影响流程
//想使用的人自己修一下这个bug就好

1.这个日历的最大特点是充分利用了自定义事件.提供了如下自定义事件:
var _selectEvents = 'select', 						//选定日期的事件
	_drawEvents   = 'beforedraw,drawing,afterdraw',	//建立日期时的事件,可以用于填充数据
	_baseEvents   = 'cellin,cellout',				//单元格的mouseover/mouseout
	_changeEvents = 'change,outofdate',            	//日历改变时,超过日历设定的最小值或最大值事件
	_uiEvents     = 'beforeshow,show,aftershow,beforehide,hide,afterhide';
针对事件编码会使组件更好维护,也更容易扩展.

2.样式基本不绑定,可以由业务调用者自己去写css.

3.通过这个组件可以很方便的扩展
* 月日历类(自带)
* 周日历类
* 天日历类
* 农历月历(已经写好插件),可以扩展成类

4.代码相对比较清楚,可以很好的与其他框架对接,只需要改最上面的adpter即可.

5.samples文件夹里有几个示例.
* calendar-framework 里展示了一个较为复杂的日历系统框架,已经分层为mvc.
* calendar-sample 展示了最基本的功能.

6.design文件夹里有设计图
因为mac下没有太合适的UML画图软件,就随便画一下,但大致能看出设计的思路和接口.
图画得比较早有可能代码实际上有些变化,但不算太大.

7.一些其他的补充
* 兼容性,我只在mac leopard下的chrome 17dev版自测了一下.没测试IE.
* calendar-framework.html下的版本最好的分辨率查看是1440px.
* 看上去是一个简单版的google calendar,有mvc结构.

8.接口说明
属性接口
initDayIndex: 0,	//按displayDays里的数据,初始化第一天是周几
displayDays: ['周日','周一','周二','周三','周四','周五','周六'],
startDate: null,	//如果大于此日期,每个单元格将填充not-the-month的样式名
endDate: null,		//如果大于此日期,每个单元格将填充not-the-month的样式名
displayRows: 5,		//显示几行,如果autoRows为true,此项会失效
autoRows: true, 	//自动设定参数,displayRows为5还是6
displayHeader: true,	//是否显示表头
baseClass: 'calendar-base-class',	//基本的className样式名
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
}
函数接口:
render(),
draw([Date]),
checkDateOutOfRange(Date)
setAutoDisplayRows()
show()
hide()
getDateFirstDayOffset([Date])	//得到一个月日历的偏移量
getCurrentDate(),
drawNextMonth(),
drawPreviousMonth(),
drawNextYear(),
drawPreviousYear()

事件列表:
var _selectEvents = 'select', 						//选定日期的事件
	_drawEvents   = 'beforedraw,drawing,afterdraw',	//建立日期时的事件,可以用于填充数据
	_baseEvents   = 'cellin,cellout',				//单元格的mouseover/mouseout
	_changeEvents = 'change,outofdate',            	//日历改变时,超过日历设定的最小值或最大值事件
	_uiEvents     = 'beforeshow,show,aftershow,beforehide,hide,afterhide';
		