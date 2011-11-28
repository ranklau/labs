/**
 * 公历转农历, 现行的格里高利公历转为阴历
 * @param
 * @return {String}
 * @seealso http://songshuhui.net/archives/16640
			http://blog.zol.com.cn/795/article_794898.html
 * @remarmks 留着备忘
	1. 冬至在十一月（为了保证正月初一在立春附近，所以十一月也称冬月）
	2. 若一月中没有中气，则该月是上个月的闰月（二十四节气中其中十二个称为中气，另十二个称为节气，中气后面是节气，节气后面是中气，冬至是中气，冬天有闰月的可能性低）
	3. 若出现闰腊月或闰正月，则将闰月提前至十一月，变为闰冬月（保证只有一个春节）
 */
var EnhanceDate = (function() {

	//据说是算农历的表，150项，对应1900年-2049年这150年
	var LUNAR_INFO =[0x04bd8,0x04ae0,0x0a570,0x054d5,0x0d260,0x0d950,0x16554,0x056a0,0x09ad0,0x055d2,0x04ae0,0x0a5b6,0x0a4d0,0x0d250,0x1d255,0x0b540,0x0d6a0,0x0ada2,0x095b0,0x14977,0x04970,0x0a4b0,0x0b4b5,0x06a50,0x06d40,0x1ab54,0x02b60,0x09570,0x052f2,0x04970,0x06566,0x0d4a0,0x0ea50,0x06e95,0x05ad0,0x02b60,0x186e3,0x092e0,0x1c8d7,0x0c950,0x0d4a0,0x1d8a6,0x0b550,0x056a0,0x1a5b4,0x025d0,0x092d0,0x0d2b2,0x0a950,0x0b557,0x06ca0,0x0b550,0x15355,0x04da0,0x0a5b0,0x14573,0x052b0,0x0a9a8,0x0e950,0x06aa0,0x0aea6,0x0ab50,0x04b60,0x0aae4,0x0a570,0x05260,0x0f263,0x0d950,0x05b57,0x056a0,0x096d0,0x04dd5,0x04ad0,0x0a4d0,0x0d4d4,0x0d250,0x0d558,0x0b540,0x0b6a0,0x195a6,0x095b0,0x049b0,0x0a974,0x0a4b0,0x0b27a,0x06a50,0x06d40,0x0af46,0x0ab60,0x09570,0x04af5,0x04970,0x064b0,0x074a3,0x0ea50,0x06b58,0x055c0,0x0ab60,0x096d5,0x092e0,0x0c960,0x0d954,0x0d4a0,0x0da50,0x07552,0x056a0,0x0abb7,0x025d0,0x092d0,0x0cab5,0x0a950,0x0b4a0,0x0baa4,0x0ad50,0x055d9,0x04ba0,0x0a5b0,0x15176,0x052b0,0x0a930,0x07954,0x06aa0,0x0ad50,0x05b52,0x04b60,0x0a6e6,0x0a4e0,0x0d260,0x0ea65,0x0d530,0x05aa0,0x076a3,0x096d0,0x04bd7,0x04ad0,0x0a4d0,0x1d0b6,0x0d250,0x0d520,0x0dd45,0x0b5a0,0x056d0,0x055b2,0x049b0,0x0a577,0x0a4b0,0x0aa50,0x1b255,0x06d20,0x0ada0,0x14b63];
	
	
	//与北京时间的时区差，毫秒数
	var _tzo = ((new Date()).getTimezoneOffset()+480)*60000,
		TimezoneOffset = _tzo >=0 ? _tzo : 0;

	
	var CHINESE_TIAN_GAN   = "甲乙丙丁戊己庚辛壬癸",		//天干
		CHINESE_DI_ZHI     = "子丑寅卯辰巳午未申酉戌亥",	//地支
		CHINESE_SHENG_XIAO = "鼠牛虎兔龙蛇马羊猴鸡狗猪",	//生肖
		CHINESE_JIE_QI     = ["小寒","大寒","立春","雨水","惊蛰","春分","清明","谷雨","立夏","小满","芒种","夏至","小暑","大暑","立秋","处暑","白露","秋分","寒露","霜降","立冬","小雪","大雪","冬至"]; //节气
		
	var TERM_INFO = [0,21208,42467,63836,85337,107014,128867,150921,173149,195551,218072,240693,263343,285989,308563,331033,353350,375494,397447,419210,440795,462224,483532,504758];//据说是算农历节气的表
	
	//一些汉字
	var CHINESE_NUMBER     = '日一二三四五六七八九十',
		LUNAR_NUMBER_MONTH = ['正','二','三','四','五','六','七','八','九','十','十一','腊'],
		LUNAR_DAY_UNIT     = '初十廿卅';
	
	//阳历节日
	//*1元旦节,代表放假1天
	var SOLAR_FESTIVAL = {"0101":"*1元旦节","0214":"情人节","0305":"学雷锋纪念日","0308":"妇女节","0312":"植树节","0315":"消费者权益日","0401":"愚人节","0501":"*1劳动节","0504":"青年节","0601":"国际儿童节","0701":"中国共产党诞辰","0801":"建军节","0910":"教师节","1001":"*3国庆节","1224":"平安夜","1225":"圣诞节"};
	
	//阴历节日
	var LUNAR_FESTIVAL = {"0101":"*2春节","0115":"元宵节","0505":"*1端午节","0815":"*1中秋节","0909":"重阳节","1208":"腊八节","0100":"除夕"};
	
	//特殊日子表
	//[阳历节日,阴历节日,节气,农历日期中文,休息几天
	//"20130203":["","","","廿三",1]
	var FIXED_DAYS = {"20071229":["","","","",0],"20071231":["","","","",1],"20080202":["","","","",-2],"20080211":["","","","",2],"20080502":["","","","",1],"20080504":["青年节","","","青年节",0],"20080609":["","","","",1],"20080915":["","","","",1],"20080927":["","","","",-2],"20080929":["","","","",2],"20090102":["","","","",1],"20090104":["","","","",0],"20090124":["","","","",0],"20090128":["","","","",3],"20090201":["","","","",0],"20090406":["","","","",1],"20090529":["","","","",1],"20090531":["","","","",0],"20090927":["","","","",0],"20091005":["","","","",4],"20091010":["","","","",0],"20100216":["","","","",4],"20100220":["","","","",-2],"20100503":["","","","",1],"20100612":["","","","",-2],"20100614":["","","","",2],"20100807":["","","立秋","立秋",0],"20100808":["","","","廿八",0],"20100919":["","","","",0],"20100923":["","","秋分","秋分",2],"20100925":["","","","",-2],"20101004":["","","","",4],"20101009":["","","","",0],
					"20110103":["","","","",1],
					"20110105":["","","","初二",0],
					"20110106":["","","小寒","小寒",0],
					"20110130":["","","","",-1],
					"20110202":["","","","",1],
					"20110207":["","","","",2],
					"20110212":["","","","",-1],
					"20110402":["","","","",-1],
					"20110404":["","","","",1],
					"20110502":["","","","",1],
					"20110606":["","","","",1],
					"20111004":["","","","",4],
					"20111008":["","","","",-2],
					"20111122":["","","","廿七",0],
					"20111123":["","","小雪","小雪",0],
					"20130203":["","","","廿三",1]
					};	
							
	function padding(s) {
		return s < 10 ? '0' + s : s;
	};
	
	function format(oDate, pattern) {
       pattern=pattern||"yyyy-MM-dd";
        var y=oDate.getFullYear();
        var o = { 
            "M" : oDate.getMonth()+1, //month
            "d" : oDate.getDate(),    //day
            "h" : oDate.getHours(),   //hour
            "m" : oDate.getMinutes(), //minute
            "s" : oDate.getSeconds() //second
        }   
        pattern=pattern.replace(/(y+)/ig,function(a,b){var len=Math.min(4,b.length);return (y+"").substr(4-len);});
        for(var i in o){ 
            pattern=pattern.replace(new RegExp("("+i+"+)","g"),function(a,b){return (o[i]<10 && b.length>1 )? "0"+o[i] : o[i]});
        }   
        return pattern;
	};
	
	function getChineseDate(lunarMonth, lunarDate){
		var msg;
		switch (lunarDate) {
			case 10:
				msg = '初十'; 
				break;
			case 20:
				msg = '二十';
				break;
			case 30:
				msg = '三十';
				break;
			default :
				msg  = LUNAR_DAY_UNIT.charAt(Math.floor(lunarDate / 10));
				msg += CHINESE_NUMBER.charAt(lunarDate % 10);
		}
		return msg;
	}

	//===== 某年的第n个节气为几日(从0小寒起算)
	function sTerm(y,n) {
	   var offDate = new Date( ( 31556925974.7*(y-1900) + TERM_INFO[n]*60000  ) + Date.UTC(1900,0,6,2,5) )
	   return(offDate.getUTCDate());
	}
	
	// 返回农历 y年的总天数
	function lYearDays(y) {
	   var i, sum = 348;
	   for(i=0x8000; i>0x8; i>>=1) sum += (LUNAR_INFO[y-1900] & i)? 1: 0
	   return(sum+leapDays(y));
	}
	// 传入 offset 返回干支, 0=甲子
	function cyclical(num) {
	   return(CHINESE_TIAN_GAN.charAt(num%10)+CHINESE_DI_ZHI.charAt(num%12));
	}
	// 返回农历 y年闰月的天数
	function leapDays(y) {
	   if(leapMonth(y))  return((LUNAR_INFO[y-1900] & 0x10000)? 30: 29)
	   else return(0);
	}
	
	// 返回农历 y年闰哪个月 1-12 , 没闰返回 0
	 function leapMonth(y) {
	   return(LUNAR_INFO[y-1900] & 0xf);
	}
	
	// 返回农历 y年m月的总天数
	function monthDays(y, m) {
	   return( (LUNAR_INFO[y-1900] & (0x10000>>m))? 30: 29 )
	} 
	
	//---以下是农历的算法，完全copy网上找的算法：--//
	//这个比较重要，农历的主要算法
	function Lunar(objDate) {
	
		var i, leap=0, temp=0;
		var baseDate = new Date(1900,0,31);
		//offset，objDate距离1900年1月31日有多少天
		var offset =((objDate - baseDate)+TimezoneOffset)/86400000;
	
		this.dayCyl = offset + 40;
		this.monCyl = 14;
	 
		for(i=1900; i<2050 && offset>0; i++) {
			temp = lYearDays(i);
			offset -= temp;
			this.monCyl += 12;
		}
	 
		if(offset<0) {
			offset += temp;
			i--;
			this.monCyl -= 12;
		}
	 
		this.year = i;
		this.yearCyl = i-1864;
	 
		leap = leapMonth(i); //闰哪个月
		this.isLeap = false;
	 
		for(i=1; i<13 && offset>0; i++){
			if(leap>0 && i==(leap+1) && this.isLeap==false){
				--i;
				this.isLeap = true;
				temp = leapDays(this.year);
			}else{
				temp = monthDays(this.year, i);
			}
			if(this.isLeap==true && i==(leap+1)){
				this.isLeap = false;
			}
			offset -= temp;
			if(this.isLeap == false){
				this.monCyl ++;
			}
		}
		
		if(offset==0 && leap>0 && i==leap+1){
			if(this.isLeap){
				this.isLeap = false;
			}else{
				this.isLeap = true;
				--i;
				--this.monCyl;
			}
		}
	 
	   if(offset<0){
		   offset += temp;
			--i;
			--this.monCyl;
		}
		this.month = i;
		this.day = offset + 1;
	}
	//-----------------------农历算法结束, copy内容结束 -----------//

	
		


	
	//--------------------------------------------------------------------------------//
	
	/**
	 * CustomDate
	 *	date Date对象
	 * solarYear 阳历年
	 * solarMonth 阳历月
	 * solarDate 阳历日
	 * solarWeekDay 阳历周
	 * solarWeekDayInChinese 阳历周中文，如：星期五
	 * solarFestival 阳历节日
	 * lunarYear 阴历年
	 * lunarMonth 阴历月
	 * lunarDate 阴历日
	 * lunarMonthInChinese
	 * lunarDateInChinese 阴历日中文：如初五
	 * lunarIsLeap 阴历是否是闰月
	 * ganzhiYear 干支年
	 * shengxiao 生肖
	 * ganzhiMonth 干支月
	 * ganzhiDate 干支日
	 * jieqi 节气
	 *
	 */
	function CustomDate(date){

		//format(date, 'M');
		var lunarDate = new Lunar(date);
		
		this.date         = date;
		this.isToday      = false;
		this.solarYear    = format(date, 'yyyy');
		this.solarMonth   = format(date, 'M');
		this.solarDate    = format(date, 'd');
		this.solarWeekDay = date.getDay();
		this.solarWeekDayInChinese = '星期' + CHINESE_NUMBER.charAt(this.solarWeekDay);
		
		this.lunarYear  = lunarDate.year;
		this.shengxiao  = CHINESE_SHENG_XIAO.charAt((this.lunarYear-4)%12);
		this.lunarMonth = lunarDate.month;
		this.lunarIsLeapMonth    = lunarDate.isLeap;
		this.lunarMonthInChinese = this.lunarIsLeapMonth ? 
									'闰' + LUNAR_NUMBER_MONTH[lunarDate.month-1] : 
									LUNAR_NUMBER_MONTH[lunarDate.month-1];
		
		this.lunarDate   = Math.floor(lunarDate.day);
		this.showInLunar = this.lunarDateInChinese = getChineseDate(this.lunarMonth, this.lunarDate);
		
		if(this.lunarDate == 1) {
			this.showInLunar = this.lunarMonthInChinese + '月';
		}
		
		this.ganzhiYear    = cyclical(lunarDate.yearCyl);
		this.ganzhiMonth   = cyclical(lunarDate.monCyl);
		this.ganzhiDate    = cyclical(lunarDate.dayCyl++);
		this.solarFestival = '';
		this.lunarFestival = '';
		this.jieqi         = '';
		this.restDays      = 0;
		
		//默认周六周日放假
		if(this.solarWeekDay==0 || this.solarWeekDay==6){
		    this.restDays=1;
		}
		
		if (format(date) == format(new Date())) {
			isToday = true;
		}
		
		if(sTerm(this.solarYear,(this.solarMonth-1)*2) == format(date, 'd')){
			this.showInLunar = this.jieqi = CHINESE_JIE_QI[(this.solarMonth-1)*2];
		}
		
		if(sTerm(this.solarYear,(this.solarMonth-1)*2+1) == format(date, 'd')){
			this.showInLunar = this.jieqi = CHINESE_JIE_QI[(this.solarMonth-1)*2+1];
		}
		
		//清明节的节气特殊判断
		if(this.showInLunar == '清明'){
			this.showInLunar = this.jieqi = '清明节';
			this.restDays = 1;
		}
		
		
		this.solarFestival = SOLAR_FESTIVAL[format(date,'MMdd')||''];
		if(/\*(\d)/.test(this.solarFestival)){
			this.restDays = parseInt(RegExp.$1);
			this.solarFestival = this.solarFestival.replace(/\*\d/, '');
		}
		
		this.showInLunar   = this.solarFestival ? this.solarFestival : this.showInLunar;
		this.lunarFestival = LUNAR_FESTIVAL[this.lunarIsLeapMonth ? '00':padding(this.lunarMonth)+padding(this.lunarDate)]||'';
		
		if(/\*(\d)/.test(this.lunarFestival)){
			this.restDays      = (this.restDays > parseInt(RegExp.$1)) ? this.restDays : parseInt(RegExp.$1);
			this.lunarFestival = this.lunarFestival.replace(/\*\d/, '');
		}
		
		if(this.lunarMonth == 12 && this.lunarDate == monthDays(this.lunarYear, 12)){
			this.lunarFestival = LUNAR_FESTIVAL['0100'];
			this.restDays = 1;
		}
		
		this.showInLunar = this.lunarFestival ? this.lunarFestival : this.showInLunar;
		this.showInLunar = (this.showInLunar.length>5) ? this.showInLunar.substr(0, 5) + '...' : this.showInLunar;
		
		//为了弥补节气错误或者是其他需要休假的问题,用fixedDay来做修正
		var fixedDays = FIXED_DAYS[format(date,'yyyyMMdd')];
		if (fixedDays) {
			this.solarFestival = fixedDays[0] || '';
		    this.lunarFestival = fixedDays[1] || '';
		    this.jieqi         = fixedDays[2] || '';
		    this.showInLunar   = fixedDays[3] || this.showInLunar;
		    this.restDays      = fixedDays[4] || 0;
		}
	}
	
	return CustomDate;
})();
