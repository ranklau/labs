/**
*@author: 
*cyhello（cyhello@gmail.com）
*seven (remember2015@gmail.com)
*rank（ranklau@gmail.com）
 */
if (!!window.ActiveXObject) {
	alert('抱歉暂不支持IE浏览器~~~\n请切换为Firefox 3.5+或Chrome 5+或Safari 4.0+');
} else {

/*
	Copyright (c) 2009, Baidu Inc. All rights reserved.
	version: $version$ $release$ released
	author: yingjiakuan@baidu.com
*/

(function(){
var trim=function(s){return s.replace(/^[\s\xa0\u3000]+|[\u3000\xa0\s]+$/g, "");};

var Selector={
	/**
	 * @property {int} queryStamp 最后一次查询的时间戳，扩展伪类时可能会用到，以提速
	 */
	queryStamp:0,
	/**
	 * @property {Json} _operators selector属性运算符
	 */
	_operators:{	//以下表达式，aa表示attr值，vv表示比较的值
		'': 'aa',//isTrue|hasValue
		'=': 'aa=="vv"',//equal
		'!=': 'aa!="vv"', //unequal
		'~=': 'aa&&(" "+aa+" ").indexOf(" vv ")>-1',//onePart
		'|=': 'aa&&(aa+"-").indexOf("vv-")==0', //firstPart
		'^=': 'aa&&aa.indexOf("vv")==0', // beginWith
		'$=': 'aa&&aa.lastIndexOf("vv")==aa.length-"vv".length', // endWith
		'*=': 'aa&&aa.indexOf("vv")>-1' //contains
	},
	/**
	 * @property {Json} _shorthands 缩略写法
	 */
    _shorthands: [
		[/\#([\w\-]+)/g,'[id="$1"]'],//id缩略写法
		[/^([\w\-]+)/g, function(a,b){return '[tagName="'+b.toUpperCase()+'"]';}],//tagName缩略写法
		[/\.([\w\-]+)/g, '[className~="$1"]'],//className缩略写法
		[/^\*/g, '[tagName]']//任意tagName缩略写法
	],
	/**
	 * @property {Json} _pseudos 伪类逻辑
	 */
	_pseudos:{
		"first-child":function(a){return a.parentNode.getElementsByTagName("*")[0]==a;},
		"last-child":function(a){return !(a=a.nextSibling) || !a.tagName && !a.nextSibling;},
		"only-child":function(a){return getChildren(a.parentNode).length==1;},
		"nth-child":function(a,iFlt){return iFlt(getNth(a,false)); },
		"nth-last-child":function(a,iFlt){return iFlt(getNth(a,true)); },
		"first-of-type":function(a){ var tag=a.tagName; var el=a; while(el=el.previousSlibling){if(el.tagName==tag) return false;} return true;},
		"last-of-type":function(a){ var tag=a.tagName; var el=a; while(el=el.nextSibling){if(el.tagName==tag) return false;} return true; },
		"only-of-type":function(a){var els=a.parentNode.childNodes; for(var i=els.length-1;i>-1;i--){if(els[i].tagName==a.tagName && els[i]!=a) return false;} return true;},
		"nth-of-type":function(a,iFlt){var idx=1;var el=a;while(el=el.previousSibling) {if(el.tagName==a.tagName) idx++;} return iFlt(idx); },//JK：懒得为这两个伪类作性能优化
		"nth-last-of-type":function(a,iFlt){var idx=1;var el=a;while(el=el.nextSibling) {if(el.tagName==a.tagName) idx++;} return iFlt(idx); },//JK：懒得为这两个伪类作性能优化
		"empty":function(a){ return !a.firstChild; },
		"parent":function(a){ return !!a.firstChild; },
		"not":function(a,sFlt){ return !sFlt(a); },
		"enabled":function(a){ return !a.disabled; },
		"disabled":function(a){ return a.disabled; },
		"checked":function(a){ return a.checked; },
		"contains":function(a,s){return (a.textContent || a.innerText || "").indexOf(s) >= 0;}
	},
	/**
	 * @property {Json} _attrGetters 常用的Element属性
	 */
	_attrGetters:function(){ 
		var o={'class': 'el.className',
			'for': 'el.htmlFor',
			'href':'el.getAttribute("href",2)'};
		var attrs='name,id,className,value,selected,checked,disabled,type,tagName,readOnly'.split(',');
		for(var i=0,a;a=attrs[i];i++) o[a]="el."+a;
		return o;
	}(),
	/**
	 * @property {Json} _relations selector关系运算符
	 */
	_relations:{
		//寻祖
		"":function(el,filter,topEl){
			while((el=el.parentNode) && el!=topEl){
				if(filter(el)) return el;
			}
			return null;
		},
		//寻父
		">":function(el,filter,topEl){
			el=el.parentNode;
			return el!=topEl&&filter(el) ? el:null;
		},
		//寻最小的哥哥
		"+":function(el,filter,topEl){
			while(el=el.previousSibling){
				if(el.tagName){
					return filter(el) && el;
				}
			}
			return null;
		},
		//寻所有的哥哥
		"~":function(el,filter,topEl){
			while(el=el.previousSibling){
				if(el.tagName && filter(el)){
					return el;
				}
			}
			return null;
		}
	},
	/** 
	 * 把一个selector字符串转化成一个过滤函数.
	 * @method selector2Filter
	 * @static
	 * @param {string} sSelector 过滤selector，这个selector里没有关系运算符（", >+~"）
	 * @returns {function} : 返回过滤函数。
	 * @example: 
		var fun=selector2Filter("input.aaa");alert(fun);
	 */
	selector2Filter:function(sSelector){
		return s2f(sSelector);
	},
	/** 
	 * 判断一个元素是否符合某selector.
	 * @method test 
	 * @static
	 * @param {HTMLElement} el: 被考察参数
	 * @param {string} sSelector: 过滤selector，这个selector里没有关系运算符（", >+~"）
	 * @returns {function} : 返回过滤函数。
	 */
	test:function(el,sSelector){
		return s2f(sSelector)(el);
	},
	/** 
	 * 用一个css selector来过滤一个数组.
	 * @method filter 
	 * @static
	 * @param {Array|Collection} els: 元素数组
	 * @param {string} sSelector: 过滤selector，这个selector里没有关系运算符（", >+~"）
	 * @param {Element} pEl: 父节点。默认是document.documentElement
	 * @returns {Array} : 返回满足过滤条件的元素组成的数组。
	 */
	filter:function(els,sSelector,pEl){
		var sltors=splitSelector(sSelector);
		return filterByRelation(pEl||document.documentElement,els,sltors);
	},
	/** 
	 * 以refEl为参考，得到符合过滤条件的HTML Elements. refEl可以是element或者是document
	 * @method query
	 * @static
	 * @param {HTMLElement} refEl: 参考对象
	 * @param {string} sSelector: 过滤selector,
	 * @returns {array} : 返回elements数组。
	 * @example: 
		var els=query(document,"li input.aaa");
		for(var i=0;i<els.length;i++ )els[i].style.backgroundColor='red';
	 */
	query:function(refEl,sSelector){
		Selector.queryStamp = queryStamp++;
		refEl=refEl||document.documentElement;
		var els=nativeQuery(refEl,sSelector);
		if(els) return els;//优先使用原生的
		var groups=trim(sSelector).split(",");
		els=querySimple(refEl,groups[0]);
		for(var i=1,gI;gI=groups[i];i++){
			var els2=querySimple(refEl,gI);
			els=els.concat(els2);
			//els=union(els,els2);//除重会太慢，放弃此功能
		}
		return els;
	}

};

/*
	retTrue 一个返回为true的函数
*/
function retTrue(){
	return true;
}

/*
	arrFilter(arr,callback) : 对arr里的元素进行过滤
*/
function arrFilter(arr,callback){
	var rlt=[],i=0;
	if(callback==retTrue){
		if(arr instanceof Array) return arr;
		else{
			for(var len=arr.length;i<len;i++) {
				rlt[i]=arr[i];
			}
		}
	}
	else{
		for(var oI;oI=arr[i++];) {
			callback(oI) && rlt.push(oI);
		}
	}
	return rlt;
};

var elContains,//部分浏览器不支持contains()，例如FF
	getChildren,//部分浏览器不支持children，例如FF3.5-
	hasNativeQuery,//部分浏览器不支持原生querySelectorAll()，例如IE8-
	findId=function(id) {return document.getElementById(id);};

(function(){
	var div=document.createElement('div');
	div.innerHTML='<div class="aaa"></div>';
	hasNativeQuery=(div.querySelectorAll && div.querySelectorAll('.aaa').length==1);
	elContains=div.contains?
		function(pEl,el){ return pEl!=el && pEl.contains(el);}:
		function(pEl,el){ return (pEl.compareDocumentPosition(el) & 16);};
	getChildren=div.children?
		function(pEl){ return pEl.children;}:
		function(pEl){ 
			return arrFilter(pEl.childNodes,function(el){return el.tagName;});
		};
})();



/*
 * nth(sN): 返回一个判断函数，来判断一个数是否满足某表达式。
 * @param { string } sN: 表达式，如：'even', 'odd', '5', '2n', '3n+2', '4n-1', '-n+6'
 * @return { function } function(i){return i满足sN}: 返回判断函数。
 */
function nth(sN){
	if(sN=="even") sN='2n';
	if(sN=="odd") sN='2n+1';
	sN=sN.replace(/(^|\D+)n/g,"$11n");
	if(!(/n/.test(sN))) {
		return function(i){return i==sN;}
	}
	else{
		var arr=sN.split("n");
		var a=arr[0]|0, b=arr[1]|0;
		return function(i){var d=i-b; return d>=0 && d%a==0;};
	}
}

/*
 * getNth(el,reverse): 得到一个元素的nth值。
 * @param { element } el: HTML Element
 * @param { boolean } : 是否反向算－－如果为真，相当于nth-last
 * @return { int } : 返回nth值
 */
function getNth(el,reverse){
	var pEl=el.parentNode;
	if(pEl.__queryStamp!=queryStamp){
		var els=getChildren(pEl);
		for(var i=0,elI;elI=els[i++];){
			elI.__siblingIdx=i;
		};
		pEl.__queryStamp=queryStamp;
		pEl.__childrenNum=i;
	}
	if(reverse) return pEl.__childrenNum-el.__siblingIdx+1;
	else return el.__siblingIdx;
}

/*
 * s2f(sSelector): 由一个selector得到一个过滤函数filter，这个selector里没有关系运算符（", >+~"）
 */
function s2f(sSelector){
	if(sSelector=='') return retTrue;
	var pseudos=[],//伪类数组,每一个元素都是数组，依次为：伪类名／伪类值
		attrs=[],//属性数组，每一个元素都是数组，依次为：属性名／属性比较符／比较值
		s=trim(sSelector);
	s=s.replace(/\:([\w\-]+)(\(([^)]+)\))?/g,function(a,b,c,d,e){pseudos.push([b,d]);return "";});//伪类
	for(var i=0,shorthands=Selector._shorthands,sh;sh=shorthands[i];i++)
		s=s.replace(sh[0],sh[1]);
	//var reg=/\[\s*([\w\-]+)\s*([!~|^$*]?\=)?\s*(?:(["']?)([^\]'"]*)\3)?\s*\]/g; //属性选择表达式解析
	var reg=/\[\s*((?:[\w\u00c0-\uFFFF-]|\\.)+)\s*(?:(\S?=)\s*(['"]*)(.*?)\3|)\s*\]/g; //属性选择表达式解析,thanks JQuery
	s=s.replace(reg,function(a,b,c,d,e){attrs.push([b,c||"",e||""]);return "";});//普通写法[foo][foo=""][foo~=""]等
	if(!(/^\s*$/).test(s)) {
		throw "Unsupported Selector:\n"+sSelector+"\n-"+s; 
	}

	//将以上解析结果，转化成过滤函数
	var flts=[];
	if(attrs.length){
		var sFun=[];
		for(var i=0,attr;attr=attrs[i];i++){//属性过滤
			var attrGetter=Selector._attrGetters[attr[0]] || 'el.getAttribute("'+attr[0]+'")';
			sFun.push(Selector._operators[attr[1]].replace(/aa/g,attrGetter).replace(/vv/g,attr[2]));
		}
		sFun='return '+sFun.join("&&");
		flts.push(new Function("el",sFun));
	}
	for(var i=0,pI;pI=pseudos[i];i++) {//伪类过滤
		var fun=Selector._pseudos[pI[0]];
		if(!fun) {
			throw "Unsupported Selector:\n"+pI[0]+"\n"+s;
		}
		if(pI[0].indexOf("nth-")==0){ //把伪类参数，转化成过滤函数。
			flts.push(function(fun,arg){return function(el){return fun(el,arg);}}(fun,nth(pI[1])));
		}
		else if(pI[0]=="not"){ //把伪类参数，转化成过滤函数。
			flts.push(function(fun,arg){return function(el){return fun(el,arg);}}(fun,s2f(pI[1])));
		}
		else if(pI[0]=="contains"){ //把伪类参数，转化成过滤函数。
			flts.push(function(fun,arg){return function(el){return fun(el,arg);}}(fun,pI[1]));
		}
		else flts.push(fun);
	}
	//返回终级filter function
	var fltsLen=flts.length;
	switch(fltsLen){//返回越简单越好
		case 0: return retTrue;
		case 1: return flts[0];
		case 2: return function(el){return flts[0](el)&&flts[1](el);};
	}
	return function(el){
		for (var i=0;i<fltsLen;i++){
			if(!flts[i](el)) return false;
		}
		return true;
	};
};

/* 
	* {int} xxxStamp: 全局变量查询标记
 */
var queryStamp=0,
	relationStamp=0,
	querySimpleStamp=0;

/*
* nativeQuery(refEl,sSelector): 如果有原生的querySelectorAll，并且只是简单查询，则调用原生的query，否则返回null. 
* @param {Element} refEl 参考元素
* @param {string} sSelector selector字符串
* @returns 
*/
function nativeQuery(refEl,sSelector){
		/*
		if(hasNativeQuery && /^((^|,)\s*[.\w-][.\w\s\->+~]*)+$/.test(sSelector)) {
			//如果浏览器自带有querySelectorAll，并且本次query的是简单selector，则直接调用selector以加速
			//部分浏览器不支持以">~+"开始的关系运算符
			var arr=[],els=refEl.querySelectorAll(sSelector);
			for(var i=0,elI;elI=els[i++];) arr.push(elI);
			return arr;
		}
		*/
		return null;
};

/* 
* querySimple(pEl,sSelector): 得到pEl下的符合过滤条件的HTML Elements. 
* sSelector里没有","运算符
* pEl是默认是document.body 
* @see: query。
*/
function querySimple(pEl,sSelector){
	querySimpleStamp++;
	/*
		为了提高查询速度，有以下优先原则：
		最优先：原生查询
		次优先：在' '、'>'关系符出现前，优先正向（从祖到孙）查询
		次优先：id查询
		次优先：只有一个关系符，则直接查询
		最原始策略，采用关系判断，即：从最底层向最上层连线，能连得成功，则满足条件
	*/

	//最优先：原生查询
	var els=nativeQuery(pEl,sSelector);
	if(els) return els;//优先使用原生的


	var sltors=splitSelector(sSelector),
		sltorsLen=sltors.length;

	var pEls=[pEl],
		i,
		elI,
		pElI;

	var sltor0;
	//次优先：在' '、'>'关系符出现前，优先正向（从上到下）查询
	while(sltor0=sltors[0]){
		if(!pEls.length) return [];
		var relation=sltor0[0];
		els=[];
		if(relation=='+'){//第一个弟弟
			filter=s2f(sltor0[1]);
			for(i=0;elI=pEls[i++];){
				while(elI=elI.nextSibling){
					if(elI.tagName){
						if(filter(elI)) els.push(elI);
						break;
					}
				}
			}
			pEls=els;
			sltors.splice(0,1);
		}
		else if(relation=='~'){//所有的弟弟
			filter=s2f(sltor0[1]);
			for(i=0;elI=pEls[i++];){
				if(i>1 && elI.parentNode==pEls[i-2].parentNode) continue;//除重：如果已经query过兄长，则不必query弟弟
				while(elI=elI.nextSibling){
					if(elI.tagName){
						if(filter(elI)) els.push(elI);
					}
				}
			}
			pEls=els;
			sltors.splice(0,1);
		}
		else{
			break;
		}
	}
	if(!sltorsLen || !pEls.length) return pEls;
	
	//次优先：idIdx查询
	for(var idIdx=0,id;sltor=sltors[idIdx];idIdx++){
		if((/^[.\w-]*#([\w-]+)/i).test(sltor[1])){
			id=RegExp.$1;
			sltor[1]=sltor[1].replace('#'+id,'');
			break;
		}
	}
	if(idIdx<sltorsLen){//存在id
		var idEl=findId(id);
		if(!idEl) return [];
		for(i=0,pElI;pElI=pEls[i++];){
			if(elContains(pElI,idEl)) {
				els=filterByRelation(pEl,[idEl],sltors.slice(0,idIdx+1));
				if(!els.length || idIdx==sltorsLen-1) return els;
				return querySimple(idEl,sltors.slice(idIdx+1).join(',').replace(/,/g,' '));
			}
		}
		return [];
	}

	//---------------
	var getChildrenFun=function(pEl){return pEl.getElementsByTagName(tagName);},
		tagName='*',
		className='';
	sSelector=sltors[sltorsLen-1][1];
	sSelector=sSelector.replace(/^[\w\-]+/,function(a){tagName=a;return ""});
	if(hasNativeQuery){
		sSelector=sSelector.replace(/^[\w\*]*\.([\w\-]+)/,function(a,b){className=b;return ""});
	}
	if(className){
		getChildrenFun=function(pEl){return pEl.querySelectorAll(tagName+'.'+className);};
	}

	//次优先：只剩一个'>'或' '关系符(结合前面的代码，这时不可能出现还只剩'+'或'~'关系符)
	if(sltorsLen==1){
		if(sltors[0][0]=='>') {
			getChildrenFun=getChildren;
			var filter=s2f(sltors[0][1]);
		}
		else{
			filter=s2f(sSelector);
		}
		els=[];
		for(i=0;pElI=pEls[i++];){
			els=els.concat(arrFilter(getChildrenFun(pElI),filter));
		}
		return els;
	}

	//次优先：只有' '关系符(走到这个分支时，sltors.length必定大于1)
	/*
	//JK2010-08：这种优先的效果不怎么好，并且从右向左查找与从左向右查找的高效用法的策略不一致，增加了用户的使用难度
	var onlyBlank=true;
	for(i=0;i<sltorsLen;i++){
		if(!sltors[i][0]){
			onlyBlank=false;
			break;
		}
	}
	if(onlyBlank){
		pEls=querySimple(pEl,sltors[0][1]);
		for(i=1;i<sltorsLen;i++){
			els=[];
			var sltorI=sltors[i][1];
			for(var j=1;j<pEls.length;j++){
				if(elContains(pEls[j-1],pEls[j])){
					pEls.splice(j,1);
					j--;
				}
			}
			if(!pEls.length) return [];
			for(var j=0;j<pEls.length;j++){
				els=els.concat(querySimple(pEls[j],sltorI));
			}
			pEls=els;
		}
		return els;
	}
	*/

	//走第一个关系符是'>'或' '的万能方案
	sltors[sltors.length-1][1] = sSelector;
	els=[];
	for(i=0;pElI=pEls[i++];){
		els=els.concat(filterByRelation(pElI,getChildrenFun(pElI),sltors));
	}
	return els;
};


function splitSelector(sSelector){
	var sltors=[];
	var reg=/(^|\s*[>+~ ]\s*)(([\w\-\:.#*]+|\([^\)]*\)|\[\s*((?:[\w\u00c0-\uFFFF-]|\\.)+)\s*(?:(\S?=)\s*(['"]*)(.*?)\6|)\s*\])+)(?=($|\s*[>+~ ]\s*))/g;
	var s=trim(sSelector).replace(reg,function(a,b,c,d){sltors.push([trim(b),c]);return "";});
	if(!(/^\s*$/).test(s)) {
		throw "Unsupported Selector:\n"+sSelector+"\n--"+s; 
	}
	return sltors;
}

/*
判断一个长辈与子孙节点是否满足关系要求。----特别说明：这里的第一个关系只能是父子关系，或祖孙关系;
*/

function filterByRelation(pEl,els,sltors){
	relationStamp++;
	var sltor=sltors[0],
		len=sltors.length,
		relationJudge=sltor[0]?	//
			function(el){return el.parentNode==pEl;}:
			retTrue;
	var filters=[],
		relations=[],
		needNext=[],
		relationsStr='';
		
	for(var i=0;i<len;i++){
		sltor=sltors[i];
		filters[i]=s2f(sltor[1]);//过滤
		relations[i]=Selector._relations[sltor[0]];//寻亲函数
		if(sltor[0]=='' || sltor[0]=='~') needNext[i]=true;//是否递归寻亲
		relationsStr+=sltor[0]|' ';
	}
	els=arrFilter(els,filters[len-1]);//自身过滤
	if(len==1) return arrFilter(els,relationJudge);
	if(/[+>]+[~ ]+/.test(relationsStr)){//需要回溯
		function chkRelation(el){//关系人过滤
			var parties=[],//中间关系人
				j=len-1,
				party=parties[j]=el;
			for(;j>-1;j--){
				if(j>0){//非最后一步的情况
					party=relations[j](party,filters[j-1],pEl);
				}
				else if(relationJudge(party)){//最后一步通过判断
					return true;
				}
				else {//最后一步未通过判断
					party=null;
				}
				while(!party){//回溯
					if(++j==len) { //cache不通过
						return false;
					}
					if(needNext[j]) {
						party=parties[j-1];
						j++;
					}
				}
				parties[j-1]=party;
			}
		};
	}
	else{//不需回溯
		function chkRelation(el){//关系人过滤
			var j=len-1;
			for(var j=len-1;j>-1;j--){
				if(j==0){
					return relationJudge(el)
				}
				else if(!(el=relations[j](el,filters[j-1],pEl))){
					return false;
				}
			}
		};
	}


	return arrFilter(els,chkRelation);
}

window.Selector=Selector;
})();


//======================== HTML Components ======================================
(function(){
	if (document.getElementById('_marmot_console')) {
		return;
	}
	var sm = document.createElement('window');
	sm.setAttribute('id', '_marmot_console');
	sm.innerHTML = '  \
	<bar class="title">\
		<icon><img width="24" height="24" src="http://labs.youa.com/~remember2015/marmot/image/map.png"/></icon>\
		<t title="可拖动"></t>\
		<button id="_marmot_tog_content_bar" onclick="Rabbit.toggleBar(\'_marmot_layer_ctx\', this)"></button>\
		<button id="_marmot_tog_play_bar" onclick="Rabbit.toggleBar(\'_marmot_play_ctx\', this)"></button>\
	</bar>\
	<bar class="content" id="_marmot_play_ctx">回放</bar>\
	<bar class="content" id="_marmot_layer_ctx" style="margin:0px 2px 2px 2px;padding:2px;">\
		<div class="toolbar" style="padding:0">\
			<icon id="_marmot_layer_new" title="新建图层" onclick="Rabbit.initLayer()"><em></em></icon><icon id="_marmot_layer_up" title="上移一层" onclick="Rabbit.setLayerUp()"><em></em></icon><icon id="_marmot_layer_down" title="下移一层" onclick="Rabbit.setLayerDown()"><em></em></icon><icon id="_marmot_layer_remove" title="删除图层" onclick="Rabbit.removeLayer()"><em></em></icon><icon id="_marmot_layer_restore" title="设置图层信息" onclick="Rabbit.setLayerInfo()"><em></em></icon><icon id="_marmot_layer_key" title="锁定图层" onclick="Rabbit.toggleLayerLock()"><em></em></icon>\
			<t>P</t><input type="text" title="透明图，0-100" id="_marmot_layer_opacity" size="2" onchange="Rabbit.setOpacity(this.value)"/><t>%</t>\
		</div>\
		<div id="_marmot_layers">\
		</div>\
	</bar>';
	document.body.appendChild(sm);

	var conf_m = document.createElement('window');
	conf_m.setAttribute('id', '_marmot_conf');
	conf_m.innerHTML = '\
	<bar class="content" id="_marmot_content_ctx">\
		<!--\
		<div id="_marmot_funcs">\
			<div class="l"><t>热力图</t><button class="r" onclick="Rabbit.toggleHeatMap(this)">ON</button><checkbox class="l" onclick="Rabbit.changeCatMap(this);Rabbit.toggleClass(this.parentNode);Rabbit.initHeatMap();"></checkbox></div>\
			<div class="l"><t>点击图</t><button class="r" onclick="Rabbit.toggleHeatMap(this)">ON</button><checkbox class="l" onclick="Rabbit.changeCatMap(this);Rabbit.toggleClass(this.parentNode);Rabbit.initClickMap();"></checkbox></div>\
			<div class="l"><t>顺序图</t><button class="r" onclick="Rabbit.toggleHeatMap(this)">ON</button><checkbox class="l" onclick="Rabbit.changeCatMap(this);Rabbit.toggleClass(this.parentNode);Rabbit.initPathMap();"></checkbox></div>\
		</div>\
		-->\
		<div>\
			<t class="l">ID</t>\
			<div class="l">\
				<input id="_marmot_id_input" value="无" onblur="Rabbit.setID(this.value)" style="width:5em;height:17px;"/>\
			</div>\
		</div>\
		<div id="_marmot_graph">\
			<t class="l">展示</t>\
			<div class="l"><select>\
				<option value="heat">热力图</option>\
				<option value="click">点击图</option>\
				<option value="path">顺序图</option>\
			</select></div>\
		</div>\
		<div id="_marmot_align">\
			<t class="l">对齐</t>\
			<div class="l"><select onchange="Rabbit.setAlignMode(this.value);">\
				<option value="middle">居中</option>\
				<option value="left">居左</option>\
			</select></div>\
		</div>\
		<div id="_marmot_time">\
			<t class="l">时间</t>\
			<div class="l"><select onchange="Rabbit.initConsole()"></select>~<select onchange="Rabbit.initConsole()"></select></div>\
		</div>\
		<!--\
		<div id="_marmot_pv">\
			<t class="l">最低PV</t>\
			<div class="l" onchange="Rabbit.initConsole()"><select>\
				<option value="">0</option>\
				<option value="10" selected>10</option>\
				<option value="100">100</option>\
				<option value="1000">1000</option>\
			</select></div>\
		</div>\
		-->\
		<div id="_marmot_refer">\
			<t class="l">来源</t>\
			<div class="l"><select style="max-width:190px;"></select></div>\
		</div>\
		<div id="_marmot_ua">\
			<t class="l">浏览器</t>\
			<div class="l"><select>\
				<option value="">所有</option>\
				<option value="ie">IE 家族</option>\
				<option value="ie6">IE 6</option>\
				<option value="ie7">IE 7</option>\
				<option value="ie8">IE 8</option>\
				<option value="gf">标准浏览器</option>\
				<option value="ff">Firefox 3.5+</option>\
				<option value="cr">Chrome 5.0+</option>\
				<option value="sf">Safari 4.0+</option>\
				<option value="op">Opera 9.0+</option>\
				<option value="un">未知/非主流</option>\
			</select></div>\
		</div>\
		<div id="_marmot_screen">\
			<t class="l">分辨率</t>\
			<div class="l"><select>\
				<option value="">所有</option>\
				<option value="1024 x 768">1024 x 768</option>\
				<option value="1440 x 900">1440 x 900</option>\
				<option value="1280 x 800">1280 x 800</option>\
				<option value="1280 x 1024">1280 x 1024</option>\
				<option value="1366 x 768">1366 x 768</option>\
				<option value="1680 x 1050">1680 x 1050</option>\
				<option value="1152 x 864">1152 x 864</option>\
				<option value="1280 x 768">1280 x 768</option>\
				<option value="1600 x 900">1600 x 900</option>\
				<option value="1280 x 960">1280 x 960</option>\
				<option value="1920 x 1080">1920 x 1080</option>\
				<option value="1280 x 720">1280 x 720</option>\
				<option value="1360 x 768">1360 x 768</option>\
			</select></div>\
		</div>\
		<div><btn style="text-align:center" onclick="Rabbit.draw()" class="l">绘制</btn></div>\
	</bar>';
	document.body.appendChild(conf_m);
	/*
	var param_m = document.createElement('window');
	param_m.setAttribute('id', '_marmot_param');
	param_m.innerHTML = '\
	<bar class="content" id="_marmot_content_ctx">\
		<div id="_marmot_gradient">\
			<t class="l">梯度</t>\
			<div class="l">\
				<input value="1" style="text" size="2" maxlength="2"></input>\
			</div>\
		</div>\
		<div id="_marmot_tolerance">\
			<t class="l">容差</t>\
			<div class="l">\
				<input value="1" style="text" size="2" maxlength="2"></input>\
			</div>\
		</div>\
		<div id="_marmot_graph">\
			<t class="l">精度</t>\
			<div class="l">\
				<input value="1" style="text" size="2" maxlength="2"></input>\
			</div>\
		</div>\
	</bar>';
	document.body.appendChild(param_m);
	*/
	var tool_m = document.createElement('window');
	tool_m.setAttribute('id', '_marmot_tool');
	tool_m.innerHTML = '\
	<bar class="content" style="padding:2px">\
		<div class="toolbar" style="padding:0;height:auto">\
			<icon id="_marmot_layer_move" title="移动图层" onclick="Rabbit.toggleClass(this, \'select\');Rabbit.moveLayer()"><em></em></icon><icon id="_marmot_layer_reset_move" title="复位图层" onclick="Rabbit.center()"><em></em></icon><icon id="_marmot_layer_mask" title="添加遮罩" onclick="Rabbit.mask()"><em></em></icon><icon id="_marmot_layer_clear" title="清空图层" onclick="Rabbit.clear()"><em></em></icon><icon id="_marmot_dom_inspect" title="选择元素" onclick="Rabbit.domInspect()"><em></em></icon><icon id="_marmot_path_trace" title="选取路径" onclick="Rabbit.pathTrace(this)"><em></em></icon><icon id="_marmot_color_picker" title="拾取颜色" onclick="Rabbit.colorPicker()"><em></em></icon>\
		</div>\
	</bar>';
	document.body.appendChild(tool_m);

})();

//=========================== UI Functions =====================================

(function(){
if (window.Rabbit) {
	return;
}
window.Rabbit = Rabbit = {
	$: function(sId) {
		return document.getElementById(sId);
	},
	pageUrl: window.location.href.replace(window.location.search, ''),
	//pageUrl: 'http://yx.youa.baidu.com/wy/zc/pre/',
	pageId: -1,
	idInputId: '_marmot_id_input',
	canvasId: '_marmot_canvas',
	confId: '_marmot_conf',
	layerId: '_marmot_layers',
	toolId: '_marmot_tool',
	consoleId: '_marmot_console',
	timeId: '_marmot_time',
	graphId: '_marmot_graph',
	referId: '_marmot_refer',
	pvId: '_marmot_pv',
	uaId: '_marmot_ua',
	screenId: '_marmot_screen',
	validDays: 10,
	currentCanvas: null,
	canvasList: [],
	cache: [],
	console: null,
	width:1000,
	height:800,
	context: null,
	callUrl: 'http://labs.youa.com/~marmot/mm-php/',
	isHeatMapShown: false,
	//显示处理信息的元素
	messageEl: (function(){
		var m = document.createElement('div');
		m.setAttribute('id', '_marmot_message');
		return m;
	})(),
	//显示Loading信息的元素
	loadingEl: (function(){
		var m = document.createElement('div');
		m.setAttribute('id', '_marmot_mask');
		m.innerHTML = '<span class="loading">处理中, 请稍候…</span>';
		return m;
	})(),
	//创建一个canvas元素并将之返回
	createCanvas: function(oArg) {
		var oCan = document.createElement('canvas');
		if (oArg.id) oCan.setAttribute('id', oArg.id);
		oCan.setAttribute('width', oArg.width);
		oCan.setAttribute('height', oArg.height);
		this.center(oCan);
		return oCan;
	},
	setID: function(s) {
		this.pageId = s;
		this.initConsole(s);
	},
	//设置一个当前的Canvas与Context
	setCurrentCanvas: function(oCanvas) {
		this.currentCanvas = oCanvas;
		this.context = oCanvas.getContext("2d");
		this.context.globalCompositeOperation = "source-over";
		this.width = parseInt(oCanvas.getAttribute('width'));
		this.height = parseInt(oCanvas.getAttribute('height'));
		//this.context.globalCompositeOperation = "lighter";
	},
	setAlignMode: function(sMode) {
		this.pageAlign = sMode;
	},
	_operateX: function() {
		if (this.pageAlign == 'middle') {
			return parseInt(this.width/2);
		} else if (this.pageAlign == 'left') {
			return 0;
		}
	},
	insertNode: function(can) {
		document.body.appendChild(can);
	},
	initUI: function() {
		//drag UI
		this.console = this.$(this.consoleId);
		this.draggable(this.console.getElementsByTagName('t')[0], this.console);
		this.draggable(this.$(this.confId).getElementsByTagName('bar')[0], this.$(this.confId))
		this.draggable(this.$(this.confId), this.$(this.confId))
		this.draggable(this.$(this.toolId), this.$(this.toolId))
		
		this.initTime();
		var layer = this.createLayer();
		this.initLayer(layer);
	},
	initTime: function() {
		var tcon = Rabbit.$(Rabbit.timeId);
		var sel = tcon.getElementsByTagName('select');
		var d = new Date();
		var ih = '';
		for (var i = 0; i < Rabbit.validDays; i++) {
			var td = d.getFullYear() + '/' + (d.getMonth()+1) + '/' + d.getDate();
			var p1 = '<option value="' + td + ' 00:00:00">' + (d.getMonth()+1) + '/' + d.getDate() + '</option>';
			ih += p1;
			d = new Date(d - 3600 * 24 * 1000);
		}
		sel[0].innerHTML = ih;
		sel[0].value = sel[0].options[1].value;
		d = new Date();
		var ih = '';
		for (var i = 0; i < Rabbit.validDays; i++) {
			var td = d.getFullYear() + '/' + (d.getMonth()+1) + '/' + d.getDate();
			var p1 = '<option value="' + td + ' 23:59:59">' + (d.getMonth()+1) + '/' + d.getDate() + '</option>';
			ih += p1;
			d = new Date(d - 3600 * 24 * 1000);
		}
		sel[1].innerHTML = ih;
	},
	createLayer: function() {
		var con = document.createElement('div');
		con.innerHTML = '<div class="item" onclick="event.stopPropagation();Rabbit.selectLayer(this.layer)"><checkbox title="是否可见" onclick="event.stopPropagation();Rabbit.toggleClass(this, \'select\');Rabbit.toggleCanvas(this.parentNode.layer.canvas);"><tick></tick></checkbox><t style="background:rgba(255,255,255,0.1)" title="双击修改名称	" ondblclick="Rabbit.editable(this);event.stopPropagation()">图层一</t><info title="查看图层信息" onclick="event.stopPropagation();Rabbit.showMapInfo(this.parentNode.layer.canvas)"></info></div>';
		var canvas = this.createCanvas({
			width: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - 10, 
			height: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight)
		});
		this.setInfo(canvas, {
			type: '',
			date_b: '',
			date_e: '',
			refer: '',
			ua: '',
			screen: '',
			opacity: 100
		});
		var uid = "0";
		while (this.layersIds[uid]) {
			uid = (Math.random() * 100000000).toFixed(0).toString();
		};
		var l = {
			id: uid,
			node: con.getElementsByTagName('div')[0],
			canvas: canvas
		};
		l.node.layer = l;
		return l;
	},
	currentLayer: null,
	setCurrentLayer: function(oLayer) {
		this.currentLayer = oLayer;
		this.setCurrentCanvas(oLayer.canvas);
		this.refreshConfig(oLayer.canvas);
	},
	layersIds: {'0':0},
	layers: [],
	initLayer: function(layer) {
		layer = layer || this.createLayer();
		this.layers.push(layer);
		if (this.layers.length == 1) {
			this.insertNode(layer.canvas);
			this.$(this.layerId).appendChild(layer.node);
		} else {
			this.currentLayer.node.parentNode.insertBefore(layer.node, this.currentLayer.node);
			if (this.currentLayer.canvas.nextElementSibling) {
				this.currentLayer.canvas.parentNode.insertBefore(layer.canvas, this.currentLayer.canvas.nextElementSibling);
			} else {
				this.insertNode(layer.canvas);
			}
		}
		this.selectLayer(layer, true);
		this.moveable();
	},
	initRefer: function() {
		if (this.isLogOn)  {
			var list = this.$(this.referId).getElementsByTagName('select')[0];
			var st = '<option value="">所有</option>';
			for (var i = 0, len = this.refers.length; i < len; i++) {
				var rf = this.refers[i].item == '-' ? '无来源' : this.refers[i].item;
				st += '<option value="' + this.refers[i].item + '">(' + this.refers[i].pv + ') ' + rf + '</span></option>';
			}
			list.innerHTML = st;
		} else {
			this.message('此页面未开启Marmot统计');
		}
	},
	setInfo: function(oCanvas, oInfo) {
		for (var o in oInfo) {
			if (oInfo.hasOwnProperty(o)) {
				oCanvas[o] = oInfo[o];
			}
		}
	},
	refreshConfig: function(oCanvas) {
		oCanvas = oCanvas || this.currentCanvas;
		this.$('_marmot_layer_opacity').value = oCanvas.opacity;
		var d = this.$(this.timeId).getElementsByTagName('select');
		d[0].value = oCanvas.date_b;
		d[1].value = oCanvas.date_e;
		this.$(this.graphId).getElementsByTagName('select')[0].value = oCanvas.type;
		this.$(this.referId).getElementsByTagName('select')[0].value = oCanvas.refer;
		this.$(this.uaId).getElementsByTagName('select')[0].value = oCanvas.ua;
		this.$(this.screenId).getElementsByTagName('select')[0].value = oCanvas.screen;
	},
	initConsole: function(mid) {
		var date = Rabbit.$(Rabbit.timeId).getElementsByTagName('select');
		//var pvSelect = this.$(this.pvId).getElementsByTagName('select')[0];
		var url = this.callUrl + '/ui/data/console/?sid=' + window.encodeURIComponent(this.pageUrl) + (mid? ('&mid='+mid) : '') +"&callback=" + "Rabbit.consoleCallback" + "&date_b=" + date[0].value.replace(/\//gi, '-') + "&date_e=" + date[1].value.replace(/\//gi, '-') + "&min_pv=";
		//console.log(url)
		this.request(url);
	},
	//控制台启用入口
	console: function() {
		this.stopMarmot();

		//创建画布，并将之设置当前的画布
		
		this.initUI();
		this.initConsole();
	},
	consoleCallback: function(arg) {
		if (arg.meta.code == 0) {
			var data = arg.data;
			this.isLogOn = data['switch'] == '1' ? true : false;
			this.pageAlign = data.pageAlign == 0 ? 'middle' : 'left';
			this.sampleRate = data.sampleRate;
			this.refers = data.referers;
			this.pageId = data.id;
			this.$(this.idInputId).value = data.id;
			this.initRefer();
		} else {
			Rabbit.message('参数错误');
		}
		this.unLoading();
	},
	//暂停Marmot点击统计
	stopMarmot: function() {
		try{
			Marmot.stop();
		} catch(e) {}
	},
	//负责内容的显示与隐藏
	toggleBar: function(sTarget, el) {
		var s = this.$(sTarget);
		if (s.style.display == 'none') {
			s.style.display = 'block';
			if (el) el.style.backgroundPosition = '-27px 0';
		} else {
			s.style.display = 'none';
			if (el) el.style.backgroundPosition = '-52px 0';
		}
	},
	draggable: function(handler, target) {
		var _draggable = false;
		var prePos = {};
		this.listen(handler, 'mousedown', function(event){
			if (event.target != handler) {
				return;
			}
			_draggable = true;
			addDragHandler(true);
			prePos = {
				x: event.clientX,
				y: event.clientY
			};
		}, false);

		this.listen(document, 'mouseup', function(event){
			_draggable = false;
			addDragHandler(false);
		}, true);
		
		function dHandler(event){
			event = event || window.event;
			var t = null;
			try {
				t = target();
			} catch(e) {
				t = target;
			}
			if (_draggable) {
				t.style.left = parseInt(t.offsetLeft) + event.clientX - prePos.x + 'px';
				t.style.top = parseInt(t.offsetTop) + event.clientY - prePos.y + 'px';
				t.style.marginLeft = '0px';
				t.style.marginTop = '0px';
				t.style.marginRight = '0px';
				t.style.marginBottom = '0px';
			}
			prePos = {
				x: event.clientX,
				y: event.clientY
			};
		}

		function addDragHandler(bool){
			if (bool) {
				Rabbit.listen(document, 'mousemove', dHandler, true);
				document.body.style['-webkit-user-select'] = 'none';
			} else {
				Rabbit.listen(document, 'mousemove', dHandler, true);
				document.body.style['-webkit-user-select'] = '';
			}
		}
	},
	editable: function(oEl) {
		var input = document.createElement('input');
		input.value = oEl.innerHTML;
		oEl.parentNode.insertBefore(input, oEl);
		Rabbit.listen(input, 'blur', function() {
			oEl.innerHTML = input.value;
			input.parentNode.removeChild(input);
			oEl.style.display = 'block';
			delete input;
		});
		oEl.style.display = 'none';
		input.focus();
	},
	fire: function(aXY, sColor) {
		for (var i = 0, len = aXY.length; i < len; i++) {
			var oPos = this._operateXY(aXY[i][0], aXY[i][1]);
			var x = aXY[i][0] + this._operateX(), y = aXY[i][1];
			var radgrad = this.context.createRadialGradient(x, y, 1, x, y, 8);
			radgrad.addColorStop( 0, sColor);
			radgrad.addColorStop( 1, 'rgba(255,30,0,0)'); 
			this.context.fillStyle = radgrad;
			this.context.fillRect( x - 8, y - 8, 16, 16);
		}
	},
	dot: function(oData) {
		var max = oData[oData.length - 1][2];

		var pi2 = Math.PI * 2;
		var threshold = this._points_min_threshold * max;
		threshold = threshold > 4 ? threshold : 4;
		var w2 = this._operateX();
		//var pr = (Math.log(245)-1)/245;

		for (var i = 0, len = oData.length; i < len; i++) {
			if (oData[i][2] < threshold)
				continue;
			oData[i][0] = oData[i][0] + w2;
			var q = Math.log(oData[i][2]) / Math.log(max);
			//var q = 1 - oData[i][2] / max;
			var rgb = this.hsb2rgb((1 - q) * 300, 1, 1);
//			var r = parseInt(128 * Math.sin((1 / 256 * q - 0.5 ) * Math.PI ) + 200); 
//			var g = parseInt(128 * Math.sin((1 / 128 * q - 0.5 ) * Math.PI ) + 127); 
//			var b = parseInt(256 * Math.sin((1 / 256 * q + 0.5 ) * Math.PI )); 
			var alp = 0.85 * q + 0.15;

			this.context.fillStyle = 'rgba(' + rgb[0] + ',' + rgb[1] + ','+ rgb[2] + ',' + alp + ')';
			this.context.beginPath();
			this.context.arc(oData[i][0], oData[i][1], 6, 0, pi2, true);
			this.context.closePath();
			this.context.fill();
		}
	},
	hsb2rgb: function(h, s, v) {
		 var i, f, p, q, t;
		 if (s == 0) return [1, 1, 1];
		 if (v == 0) return [0, 0, 0];
		 if (h == 360) h = 0;
		 h /= 60;
		 i = Math.floor(h);
		 f = h - i;
		 p = v * (1 - s);
		 q = v * (1 - (s * f));
		 t = v * (1 - (s * (1 - f)));
		 var rt = [[v, t, p], [q, v, p], [p, v, t], [p, q, v], [t, p, v], [v, p, q]][i];
		 rt[0] *= 255;
		 rt[1] *= 255;
		 rt[2] *= 255;
		 rt[0] = parseInt(rt[0]);
		 rt[1] = parseInt(rt[1]);
		 rt[2] = parseInt(rt[2]);
		 return rt
	},
	loading: function() {
		this.insertNode(this.loadingEl);
	},
	unLoading: function() {
		Rabbit.loadingEl.parentNode.removeChild(Rabbit.loadingEl);
	},
	//messsage显示时间的计时器
	inv: null,
	message: function(str) {
		if (this.inv === null) {
			this.insertNode(this.messageEl);
		} else {
			window.clearInterval(this.inv);
		};
		this.messageEl.innerHTML = str;
		this.inv = window.setTimeout(function() {
			Rabbit.messageEl.parentNode.removeChild(Rabbit.messageEl);
			Rabbit.inv = null;
		}, 1500)
	},
	click: function(oPn) {
		//this.mask();
		var total = 0;
		var cache = [];
		this.pageWidth();
		for (var o in oPn) {
			if (oPn.hasOwnProperty(o)) {
				var m = this.processPath(o, oPn[o])
				if (m) {
					cache.push(m);
					total += m[2];
				}
			}
		};
		cache.sort(function(a, b) {
			return a[2] - b[2];
		});
		for (var i = 0; i < cache.length; i++) {
			Rabbit.pathClick(cache[i][0], cache[i][1], cache[i][2], total);
		}
	},
	_pageWidth: 0,
	pageWidth: function(){
		var doc = doc || window.document, win = doc.parentWindow || doc.defaultView, $F  = function (val) { return parseInt(val, 10) || 0; }, width = Math.max ($F(doc.documentElement.clientWidth) , 0), scrollWidth = Math.max ($F(doc.documentElement.scrollWidth) , $F(doc.body.offsetWidth));
		if ((!doc.compatMode || doc.compatMode == 'CSS1Compat') && doc.documentElement && doc.documentElement.clientHeight) {
			width  = doc.documentElement.clientWidth;
		} else if (doc.body && doc.body.clientHeight) {
			width  = doc.body.clientWidth;
		} else if(win.innerWidth && win.innerHeight && doc.width) {
			width  = win.innerWidth;
			if (doc.width>width)   width  -= 16;
		} 
		this._pageWidth = Math.max(width, scrollWidth);
	},
	getPos: function(el, type) {
		var old = el;
		var y = el.offsetTop;
		var x = el.offsetLeft;
		while (el = el.offsetParent) {
			y += el.offsetTop;
			x += el.offsetLeft;
		}
		if (type && type == "center") {
			return {
				x: x + parseInt(old.offsetWidth * 0.2) + parseInt(old.offsetWidth * 0.6 * Math.random()),
				y: y + parseInt(old.offsetHeight * 0.4) + parseInt(old.offsetHeight * 0.3 * Math.random())
			}
		} else {
			return {
				x: x,
				y: y
			};
		}
	},
	processPath: function(path, num, type) {
		
		var pw =  this._pageWidth;
		var _mid = 0;
		if (this.pageAlign == 'middle') {
			_mid = pw/2;
		} else if (this.pageAlign == 'left') {
			_mid = 0;
		}
		//console.log(path, num);
		//path = path.replace(/(~\d*a)(.*$)/i, '$1');
		path = path.replace(/~(\d+)([^~]+)/gi, '~$2:nth-of-type($1)').replace(/\~/gi, '>').replace(/\./gi, '#');
		if (path.charAt(0) == ' ') {
			path = 'body ' + path;
		} else if (path == '') {
			path = 'body';
		}
		//console.log(path)
		var el = null;
		try{
			el = window.Selector.query(null, path);
			el = el[0];
		}catch(e){
		}
		//这里可以限定显示那些标签的点击情况
		//var tgn = el.tagName.toLowerCase();
		if (el) {
			var tgn = el.tagName.toLowerCase();
//			if (tgn == 'a' || tgn == 'button' || tgn == 'input' || tgn == 'select' || tgn == 'textarea' || tgn == 'img' || tgn == 'em' || tgn == 'font'|| tgn == 'span') {
			if (tgn != 'div' && tgn != 'body') {
				var pos = window.Rabbit.getPos(el, type);
				if (typeof pos.x == 'number' && typeof pos.y == 'number') {
					if (pos.x == 0 && pos.y == 0) {
						return false;
					}
					return [parseInt(pos.x - _mid), pos.y, num];
				}
			}
		} else {
			try{
				//console.log('error ' + path);
			}catch(e){}
		}
		return false;
	},
	mask: function(sColor) {
		var radgrad = this.context.createLinearGradient(2, 0, this.width - 10, 0);
		radgrad.addColorStop( 0, 'rgba(0,0,0,0)');
		radgrad.addColorStop( 0.4, 'rgba(0,0,0,0.25)');
		radgrad.addColorStop( 0.5, 'rgba(0,0,0,0.3)');
		radgrad.addColorStop( 0.6, 'rgba(0,0,0,0.25)');
		radgrad.addColorStop( 1, 'rgba(0,0,0,0)'); 
		this.context.fillStyle = radgrad;
		//this.context.fillRect( oData[i][0] - 7, oData[i][1] - 7, 14, 14);
		//this.context.fillStyle = sColor || "rgba(0,0,0,0.5)";
		this.context.fillRect(0, 0, this.width, this.height);
	},
	pathClick: function(x, y, num, total) {
		//console.log(x, y, num, el)
		x= x + this._operateX();
		x = parseInt(x, 10);
		y = parseInt(y, 10);
		var ctx = this.context;
		ctx.fillStyle = "rgba(255,255,255,0.8)";
		var so = "";
		if (num < 1000) {
			so = "rgb(40,40,200)";
		} else if (num < 5000) {
			so = "rgb(20,160,10)";
		} else if (num < 10000) {
			so = "rgb(240,160,0)";
		} else {
			so = "rgb(250,0,0)";
		}
		/*
		ctx.beginPath();
		ctx.moveTo(x, y);
		ctx.lineWidth = 2;
		ctx.lineTo(x + 50, y);
		ctx.lineTo(x + 50, y + 20);
		ctx.lineTo(x, y + 20);
		ctx.lineTo(x, y);
		//ctx.fill();
//		ctx.fillRect(x, y, 50, 20);
		ctx.stroke();
		ctx.closePath();
		*/
		var ratio = (num / total * 100).toFixed(0);
		var ratio_width = (ratio >= 10 ? 14 : 8);
		var px = (parseInt(Math.log(num) / Math.log(10)) + 2) * 7 + 4 + ratio_width;
		ctx.fillStyle = so;
		//console.log(num, px);
		x = x + 1;
		y = y + 1;
		ctx.fillRect(x-1, y-1, px + 2, 16);
		ctx.clearRect(x, y, px, 14);
		ctx.fillStyle = "rgba(255,255,255,0.9)";
		ctx.fillRect(x, y, px, 14);
		ctx.font = "13px Consolas";
		ctx.fillStyle = so;
		ctx.fillText(num.toString() + '/' + ratio.toString(), x + 2, y + 11);
	},
	link: function(aLink) {
		var color = "rgba(" + Math.floor( Math.random()*255 ) + "," + Math.floor( Math.random()*255 ) + "," + Math.floor( Math.random()*255 );
		this.dot(aLink, color+ ", 0.1)");
		this.lineTo(aLink, color + ", 0.1)");
	},
	_path_cache: {},
		/*
	pathLink: function(aLink) {
		var total = 0;
		var p = [];
		this.pageWidth();
		for (var i = 0; i < aLink.length; i++) {
			if (this._path_cache[aLink[i]]) {
				p.push(this._path_cache[aLink[i]]);
			} else {
				var t = this.processPath(aLink[i], 1, 'center');
				if (t) {
					this._path_cache[aLink[i]] = t;
					p.push([t[0]+24, t[1]+24]);
				}
			}
		};
		if (p.length > 0) {
			this.link(p);
		}
	},
	*/
	mark: function(oData, total) {
		var max = oData[oData.length - 1][2];

		var pi2 = Math.PI * 2;
		var threshold = this._points_min_threshold * max;
		threshold = threshold > 4 ? threshold : 4;
		var w2 = this._operateX();
		//var pr = (Math.log(245)-1)/245;
		var marker = new Image();
		marker.src = 'http://labs.youa.com/~remember2015/marmot/image/marker.png';
		var ctx = this.context;
		marker.onload = function() {
			for (var i = 0, len = oData.length; i < len; i++) {
				if (oData[i][2] < threshold)
					continue;
				var x = oData[i][0], y = oData[i][1];
				var ratio = oData[i][2] + '|' + (oData[i][2] / total*100).toFixed(0) + '%';
				ctx.drawImage(this, x - 11, y - 22);
				//ctx.moveTo(x, y);
				//ctx.quadraticCurveTo(oData[i][0]);
				var w = ratio.length * 5.8;
				var h = 0;
				x = x + 17;
				y = y - 12;
				var r = 7;
				ctx.fillStyle = 'rgba(255,160,160,0.9)';
				ctx.strokeStyle = 'rgb(230,80,80)';
				ctx.beginPath();
				ctx.moveTo(x-r, y);
				ctx.arc(x, y, r, -Math.PI, -Math.PI / 2, false);
				ctx.lineTo(x + w, y - r);
				ctx.arc(x + w, y, r, -Math.PI / 2, 0, false);
				ctx.lineTo(x + r + w, y + h);
				ctx.arc(x + w , y + h, r, 0, Math.PI / 2, false);
				ctx.lineTo(x, y + h + r);
				ctx.arc(x, y + h, r, Math.PI / 2, Math.PI, false);
				ctx.lineTo(x - r, y);
				ctx.closePath();
				ctx.stroke();
				ctx.fill();
				ctx.font = "13px Consolas";
				ctx.fillStyle = 'rgb(255,255,255)';
				ctx.fillText(ratio, oData[i][0] + 13, oData[i][1] - 8);
			}
		}
	},
	pathLink: function(aLink) {
		var total = 0;
		var p = [];
		this.pageWidth();
		var pos_cache = {};
		var invalid_pos_cache = {};
		var points_cache = {};
		var paths_cache = {};

		for (var i = 0, leni = aLink.length; i < leni; i++) {
			for (var j = 0, lenj = aLink[i].length; j < lenj; j++) {
				var pos = '';
				if (invalid_pos_cache[aLink[i][j]]) continue;
				if (pos_cache[aLink[i][j]]) {
					pos = pos_cache[aLink[i][j]];
				} else {
					var npos = Rabbit.processPath(aLink[i][j], 1, 'center');
					if (npos) {
						pos = npos[0] + '*' + npos[1];
						pos_cache[aLink[i][j]] = pos;
						//p.push([t[0]+24, t[1]+24]);
					} else {
						invalid_pos_cache[aLink[i][j]] = true;
					}
				}
				if (pos == '') continue;
				if (points_cache[pos]) {
					points_cache[pos]++;
				} else {
					points_cache[pos] = 1;
				}

				if (j > 0) {
					if (pos_cache[aLink[i][j - 1]]) {
						var _p = pos_cache[aLink[i][j - 1]] + '>' + pos;
						if (paths_cache[_p]) {
							paths_cache[_p]++;
						} else {
							paths_cache[_p] = 1;
						}
					}
				}

			}
		};

		var points = [];
		var paths = [];
		for (var o in points_cache) {
			if (points_cache.hasOwnProperty(o)) {
				var _xy = o.split('*');
				points.push([parseInt(_xy[0]), parseInt(_xy[1]), points_cache[o]]);
			}
		}
		for (var o in paths_cache) {
			if (paths_cache.hasOwnProperty(o)) {
				var _ft = o.split('>');
				var pre = _ft[0].split('*');
				var nex = _ft[1].split('*');
				paths.push([[parseInt(pre[0]), parseInt(pre[1])], [parseInt(nex[0]), parseInt(nex[1])], paths_cache[o]]);
			}
		}
		points.sort(function(a, b) {
			return a[2] - b[2];
		});
		paths.sort(function(a, b) {
			return a[2] - b[2];
		});

		this.pointTo(paths);
		this.dot(points);

	},
	line: function(aXY, sColor) {
		this.context.strokeStyle = sColor;
		this.context.lineCap = "round";
		this.context.lineWidth = 1;
		this.context.prevPos = {
			x: aXY[0][0],
			y: aXY[0][1]
		}
		for (var i = 1, len = aXY.length; i < len; i++) {
			var x = aXY[i][0], y = aXY[i][1];
			this.context.beginPath();
			this.context.moveTo(this.context.prevPos.x, this.context.prevPos.y);
			this.context.lineTo(x, y);
			this.context.stroke();
			this.context.closePath();
			this.context.prevPos = {
				x: x,
				y: y
			}
		}
	},
	pointTo: function(oData) {
		if (oData.length == 0) return;
		var max = oData[oData.length - 1][2];

		var pi2 = Math.PI * 2;
		var threshold = this._points_min_threshold * max;
		threshold = threshold > 4 ? threshold : 4;
		var w2 = this._operateX();
		//var pr = (Math.log(245)-1)/245;

		for (var i = 0, len = oData.length; i < len; i++) {
			
			if (oData[i][2] < threshold)
				continue;
			var q = Math.log(oData[i][2]) / Math.log(max);
			//var q = 1 - oData[i][2] / max;
			var rgb = this.hsb2rgb((1 - q) * 300, 1, 1);
//			var r = parseInt(128 * Math.sin((1 / 256 * q - 0.5 ) * Math.PI ) + 200); 
//			var g = parseInt(128 * Math.sin((1 / 128 * q - 0.5 ) * Math.PI ) + 127); 
//			var b = parseInt(256 * Math.sin((1 / 256 * q + 0.5 ) * Math.PI )); 
			var alp = 0.85 * q + 0.15;

			this.context.fillStyle = 'rgba(' + rgb[0] + ',' + rgb[1] + ','+ rgb[2] + ',' + alp + ')';
			this.context.strokeStyle = 'rgba(' + rgb[0] + ',' + rgb[1] + ','+ rgb[2] + ',' + alp + ')';
			this.context.lineCap = "round";
			this.context.lineWidth = 1;
			
			var pre_point = oData[i][0];
			var nex_point = oData[i][1];

			pre_point[0] = pre_point[0] + w2;
			nex_point[0] = nex_point[0] + w2;

			var ang = Math.atan((pre_point[0] - nex_point[0])/(pre_point[1] - nex_point[1])) + (pre_point[1] - nex_point[1] > 0 ? 0 : Math.PI);
			ang = ang || 0;
			this.context.beginPath();
			this.context.moveTo(pre_point[0] - 6 * Math.sin(ang), pre_point[1] - 6 * Math.cos(ang));
			var newx = nex_point[0] + 6 * Math.sin(ang), newy = nex_point[1] + 6 * Math.cos(ang);
			this.context.lineTo(newx, newy);
			var ang1 = ang - Math.PI / 6;
			var ang2 = ang + Math.PI / 6;

			this.context.lineTo(newx + Math.sin(ang1)*8, newy + Math.cos(ang1)*8);
			//this.context.moveTo(newx, newy);
			this.context.lineTo(newx + Math.sin(ang2)*8, newy + Math.cos(ang2)*8);
			this.context.lineTo(newx, newy);

			this.context.fill();

			if (pre_point[0] == nex_point[0] || pre_point[1] == nex_point[1]) {
				this.context.arc(pre_point[0] + 9, pre_point[1] + 9, 10, - Math.PI * 0.75, Math.PI, false);
			} 
			this.context.stroke();
			this.context.closePath();
		}
	},
	color: function() {

		var imgd = this.context.getImageData(0, 0, this.width, this.height);
		var pix = imgd.data;

		// Loop over each pixel and invert the color.
		for (var i = 0, n = pix.length; i < n; i += 4) {
			var a = pix[i+3];
			pix[i  ] = 128 * Math.sin((1 / 256 * a - 0.5 ) * Math.PI ) + 200; 
			//pix[i] = 1 / 128 * Math.pow(a - 128, 2) + 127;
			//pix[i+1] = 1 / 256 * Math.pow(a, 2); 
			pix[i+1] = 128 * Math.sin((1 / 128 * a - 0.5 ) * Math.PI ) + 127; 
			pix[i+2] = 256 * Math.sin((1 / 256 * a + 0.5 ) * Math.PI ); //128之后直接衰减为0
			//pix[i+3] = a > 0 ? 0.75 * a + 64 : 0;
			//pix[i+3] = 32 * Math.log(a+1) / Math.log(2);
			//pix[i+3] = a - 128 / 128 / 128 * Math.pow(a - 128, 2) + 128;
			pix[i+3] = pix[i+3] * 0.8;
		}

		// Draw the ImageData at the given (x,y) coordinates.
		this.context.putImageData(imgd, 0, 0);
	},
	clear: function() {
		this.context.clearRect(0, 0, this.width, this.height);
		//this.context.translate(1200,600);
	},
	center: function(oCanvas) {
		oCanvas = oCanvas || this.currentCanvas;
		oCanvas.style.marginLeft = '-' + parseInt(oCanvas.getAttribute('width')) / 2 + 'px';
		oCanvas.style.left = '50%';
		oCanvas.style.top = '0px';
		oCanvas.style.position = 'absolute';
		oCanvas.style.zIndex = '65533';
	},
	show: function() {
		this.currentCanvas.style.display = 'block';
	},
	hide: function() {
		this.currentCanvas.style.display = 'none';
	},
	graphUrlType: {
		'heat': 'points',
		'click': 'paths',
		'path': 'paths'
	},
	graphDrawType: {
		'heat': 'points',
		'click': 'paths',
		'path': 'paths'
	},
	draw: function(sType, sCallback) {
		this.message('获取数据…');
		var dateSelect = this.$(this.timeId).getElementsByTagName('select');
		var graphSelect = this.$(this.graphId).getElementsByTagName('select')[0];
		var referSelect = this.$(this.referId).getElementsByTagName('select')[0];
		var uaSelect = this.$(this.uaId).getElementsByTagName('select')[0];
		var screenSelect = this.$(this.screenId).getElementsByTagName('select')[0];
		var url = this.callUrl + '/ui/data/' + (sType ? sType : this.graphUrlType[graphSelect.value]) + '/?mid=' + this.pageId + "&callback=" + (sCallback ? sCallback : "Rabbit." + graphSelect.value + "Callback") + "&date_b=" + dateSelect[0].value.replace(/\//gi, '-') + "&date_e=" + dateSelect[1].value.replace(/\//gi, '-') + "&ref=" + referSelect.value + "&ua=" + uaSelect.value + '&screen=' + screenSelect.value;

		this.setInfo(this.currentCanvas, {
			date_b: dateSelect[0].value,
			date_e: dateSelect[1].value,
			type: graphSelect.value,
			refer: referSelect.value,
			ua: uaSelect.value,
			screen: screenSelect.value
		});
		this.selectLayer(this.currentLayer, true);
		this.clear();
		this.hide();
		this.request(url);
		this.show();
	},
	/*
	changeCatMap: function(el) {
		var lis = Rabbit.$('_marmot_funcs').getElementsByTagName('checkbox');
		for (var i = 0, len = lis.length; i < len; i++) {
			var classname = 'select';
			var cls = lis[i].parentNode.getAttribute('class') || '';
			if (cls.indexOf(classname) > -1) {
				lis[i].parentNode.setAttribute('class', cls.replace(classname, ''));
			} 
		}
	},
	freeExcept: function(el) {
		var lis = Rabbit.$('_marmot_refers').getElementsByTagName('li');
		for (var i = 0, len = lis.length; i < len; i++) {
			var classname = 'select';
			var cls = lis[i].getAttribute('class') || '';
			if (cls.indexOf(classname) > -1) {
				lis[i].setAttribute('class', cls.replace(classname, ''));
			} 
		}
	},
	*/
	/*
	heatCallback: function(r) {
		if (r.meta.code == 0) {
			var points = r.data.points;
			this.hide();
			for (var i = 0, len = points.length; i < len; i++) {
				this.fire(points[i], 'rgba(255,60,0,0.1)');
			}
			this.color();
			this.show();
			//this.link(points);
			this.message('热力图绘制成功');
		} else {
			this.message('热力图绘制失败');
		}
		this.unLoading();
	},
	*/
	_points_min_threshold: 0.002,
	heat: function(oData) {
		if (oData.length == 0) 
			return;
		max = oData[oData.length - 1][2];
		var w2 = this._operateX();
		var pi2 = Math.PI * 2;
		var threshold = this._points_min_threshold * max;
		threshold = threshold > 4 ? threshold : 4;
		var pr = (Math.log(245)-1)/245;
		for (var i = 0, len = oData.length; i < len; i++) {
			if (oData[i][2] < threshold)
				continue;
			oData[i][0] = oData[i][0] + w2 + (oData[i][0] > 0 ? 0 : 1);
			var q = Math.log(oData[i][2]) / Math.log(max);
			//var q = Math.sqrt(oData[i][2] / max);
			//var q = 1 - oData[i][2] / max;
			var rgb = this.hsb2rgb((1 - q) * 280, 1, 1);
//			var r = parseInt(128 * Math.sin((1 / 256 * q - 0.5 ) * Math.PI ) + 200); 
//			var g = parseInt(128 * Math.sin((1 / 128 * q - 0.5 ) * Math.PI ) + 127); 
//			var b = parseInt(256 * Math.sin((1 / 256 * q + 0.5 ) * Math.PI )); 
			var alp = 0.9 * q + 0.1;
			//var alp = (Math.exp(pr * q + 1) + 10) / 255
			
			var radgrad = this.context.createRadialGradient(oData[i][0], oData[i][1], 1, oData[i][0], oData[i][1], 8);
			radgrad.addColorStop( 0, 'rgba(' + rgb[0] + ',' + rgb[1] + ','+ rgb[2] + ',' + alp + ')');
			radgrad.addColorStop( 1, 'rgba(' + rgb[0] + ',' + rgb[1] + ','+ rgb[2] + ',0)'); 
			this.context.fillStyle = radgrad;
			this.context.fillRect( oData[i][0] - 8, oData[i][1] - 8, 16, 16);
			
			/*
			this.context.fillStyle = 'rgba(' + r + ',' + g + ','+ b + ',' + alp + ')';
			this.context.beginPath();
			this.context.arc(oData[i][0], oData[i][1], 3, 0, pi2, true);
			this.context.closePath();
			this.context.fill();
			*/
			/*
			this.context.fillStyle = 'rgba(' + r + ',' + g + ','+ b + ',' + alp + ')';
			this.context.fillRect( oData[i][0] - 3, oData[i][1] - 3, 7, 7);
			*/
		}
	},
	heatCallback: function(r) {
		if (r.meta.code == 0) {
			var points = r.data.points;
			this.hide();
			var cache = {};
			for (var i = 0, len = points.length; i < len; i++) {
				for (var j = 0, len2 = points[i].length; j < len2; j++) {
					var key = points[i][j][0] + '*' + points[i][j][1];
					if (cache[key]) {
						cache[key] ++;
					} else {
						cache[key] = 1;
					}
				}
			}
			var acache = [];
			for (var m in cache) {
				if (m == '0*0') continue;
				var x = parseInt(m.split('*')[0], 10);
				var y = parseInt(m.split('*')[1], 0);
				acache.push([x, y, cache[m]]);
			}
			acache.sort(function(a, b){
				return a[2] - b[2];
			});
			this.heat(acache);
			//this.color();
			this.show();
			//this.link(points);
			this.message('热力图绘制成功');
		} else {
			this.message('热力图绘制失败');
		}
		this.unLoading();
	},
	clickCallback: function(r) {
		if (r.meta.code == 0) {
			var points = r.data.paths;
			this.hide();
			var cache = {};
			for (var i = 0, len = points.length; i < len; i++) {
				for (var j = 0; j < points[i].length; j++) {
					points[i][j] = points[i][j] == '' ? '~' : points[i][j];
					if (cache[points[i][j]] !== undefined) {
						cache[points[i][j]] += 1;
					} else {
						cache[points[i][j]] = 1;
					}
				}
			}
			this.click(cache);
			//this.color();
			this.show();
			//this.link(points);
			this.message('点击图绘制成功');
		} else {
			this.message('点击图绘制失败');
		}
		this.unLoading();
	},
	pathCallback: function(r) {
		this._path_cache = {};
		if (r.meta.code == 0) {
			//var points = r.data.points;
			var points = r.data.paths;
			this.hide();
			/*
			for (var i = 0, len = points.length; i < len; i++) {
				//this.link(points[i], 'rgba(255,60,0,0.3)');
				this.pathLink(points[i], 'rgba(255,60,0,0.3)');
			}
			*/
			this.pathLink(points);
			this.show();
			//this.link(points);
			this.message('顺序图绘制成功');
		} else {
			this.message('顺序图绘制失败');
		}
		this.unLoading();
	},
	request: function(oArg) {
		this.loading();
		var head = document.getElementsByTagName("head")[0];
		var script = document.createElement("script");
		script.src = oArg;
		head.appendChild(script);
		this.message('请求中…');
		return true;
	},
	toggleCanvas: function(oCanvas) {
		if (oCanvas.style.display == 'none') {
			oCanvas.style.display = 'block';
		} else {
			oCanvas.style.display = 'none';
		}
	},
	toggleClass: function(el, classname) {
		classname = classname || 'select';
		var cls = el.getAttribute('class') || '';
		if (cls.indexOf(classname) > -1) {
			el.setAttribute('class', cls.replace(classname, ''));
		} else {
			el.setAttribute('class', cls + ' ' + classname);
		}
	},
	selectLayer: function(oLayer, bVisible, sClassname) {
		oLayer = oLayer || this.currentLayer;
		sClassname = sClassname || 'select';
		var cls = oLayer.node.getAttribute('class') || '';
		for (var i = 0; i < this.layers.length; i++) {
			if (this.layers[i] != oLayer){
				this.layers[i].node.setAttribute('class', 'item');
			}
		}
		if (cls.indexOf(sClassname) < 0) {
			oLayer.node.setAttribute('class', cls + ' ' + sClassname);
		}
		this.setCurrentLayer(oLayer);
		if (bVisible) {
			var m = oLayer.node.getElementsByTagName('checkbox')[0];
			var cls = m.getAttribute('class') || '';
			if (cls.indexOf('select') < 0) {
				m.setAttribute('class', cls + ' ' + sClassname);
			}
			Rabbit.show();
		}
	},
	setLayerUp: function() {
		var ly = this.currentLayer.node;
		var pl = ly.previousElementSibling;
		if (pl !== null) {
			ly.parentNode.insertBefore(ly, pl);
			pl.layer.canvas.parentNode.insertBefore(pl.layer.canvas, ly.layer.canvas);
		} else {
			var mp = ly.parentNode.children[ly.parentNode.children.length - 1];
			ly.parentNode.appendChild(ly);
			ly.layer.canvas.parentNode.insertBefore(ly.layer.canvas, mp.layer.canvas);
		}
	},
	setLayerDown: function() {
		var ly = this.currentLayer.node;
		var pl = ly.nextElementSibling;
		if (pl === null) {
			pl = Rabbit.currentLayer.node;
			ly = ly.parentNode.children[0];
			pl.layer.canvas.parentNode.appendChild(pl.layer.canvas);
		} else {
			pl.layer.canvas.parentNode.insertBefore(ly.layer.canvas, pl.layer.canvas);
		}
		pl.parentNode.insertBefore(pl, ly);
	},
	removeLayer: function() {
		if (this.layers.length == 1) {
			this.message('同学，就一个层了，你也想清除?');
			return;
		}
		var old = this.currentLayer;
		var lst = this.layers;
		for (var i = 0; i < lst.length; i++) {
			if (lst[i] == this.currentLayer) {
				lst[i].canvas.parentNode.removeChild(lst[i].canvas);
				lst[i].node.parentNode.removeChild(lst[i].node);
				lst.splice(i, 1);
				break;
			}
		}
		this.currentLayer = this.layers[this.layers.length - 1];
		this.selectLayer(this.currentLayer, true);
	},
	setLayerInfo: function() {
		this.message('同学，我最近比较忙，还没有做这个功能');
	},
	toggleLayerLock: function() {
		this.message('同学，我最近比较忙，还没有做这个功能');
	},
	showMapInfo: function() {
		this.message('同学，我最近比较忙，还没有做这个功能');
	},
	setOpacity: function(n) {
		n = parseInt(n, 10);
		if (typeof n != 'number') {
			this.message('输入数字……0-100之间哦~');
			return;
		} else if (n < 0 || n > 100) {
			this.message('0-100之间哦');
			return;
		} else {
			this.currentCanvas.opacity = n;
			this.currentCanvas.style.opacity = n/100;
		}
	},
	moveable: function() {
		var mask = document.createElement('div');
		mask.setAttribute('id', '_marmot_move_mask');
		this.insertNode(mask);
		this.draggable(mask, function(){
			return Rabbit.currentCanvas;
		});
	},
	moveLayer: function() {
		var mask = this.$('_marmot_move_mask');
		if (window.getComputedStyle(mask, null).display == 'none') {
			mask.style.display = 'block';
		} else {
			mask.style.display = 'none';
		}
	},
	_inspect_element: null,
	domInspector: function(event) {
		event.preventDefault();
		event.stopPropagation();
		var t = event.target;
		Rabbit._inspect_element = t;
		if (t != Rabbit._target_mask && t != document.body && t.nodeType == 1) {
			var pos = Rabbit.getPos(t);
			Rabbit._target_mask.style.left = pos.x - 1 + 'px';
			Rabbit._target_mask.style.top = pos.y - 1 + 'px';
			Rabbit._target_mask.style.width = t.offsetWidth + 'px';
			Rabbit._target_mask.style.height = t.offsetHeight + 'px';
		}
	},
	encode4html: function(sTarget) {
		var con = document.createElement("div");
		var text = document.createTextNode(sTarget);
		con.appendChild(text);
		return con.innerHTML.replace(/"/g,"&quot;").replace(/'/g,"&#039;");
	},
	selectElement: function(event, callback) {
		callback = callback || Rabbit._eleSelectHandler;
		//console.log('ss')
		event.preventDefault();
		event.stopPropagation();
		var t = Rabbit._inspect_element;
		if (t != null && t != Rabbit._target_mask && t != document.body && t.nodeType == 1) {
			Rabbit.message('您选中了 -> ' + Rabbit.encode4html(t.innerHTML.replace(/<[^<>]*>/gi, '')));
			callback(event);
		}
	},
	dashboard: (function() {
		var div = document.createElement('window');
		div.setAttribute('id', '_marmot_dashboard');
		div.innerHTML = '<window class="_marmot_dashboard_pointer"></window><div class="toolbar" style="height:24px;"><icon id="_marmot_in_degree" onclick="Rabbit.indegree()" title="入度"><em></em></icon><icon id="_marmot_out_degree" onclick="Rabbit.outdegree()" title="出度"><em></em></icon><icon id="_marmot_leave_degree" onclick="Rabbit.leavedegree()" title="丢失率"><em></em></icon></div>';
		return div;
	})(),
	initDashboard: function() {
		this.insertNode(this.dashboard);
	},
	focusDashboard: function(oEl) {
		var pos = this.getPos(oEl);
		this.dashboard.style.display = 'block';
		this.dashboard.style.left = pos.x - 2 + 'px';
		this.dashboard.style.top = pos.y - 32 + 'px';
	},
	blurDashboard: function() {
		try{
		this.dashboard.parentNode.removeChild(this.dashboard);
		}catch(e){}
	},
	_is_inspect: false,
	_target_mask: (function() {
		var o = document.createElement('div');
		o.setAttribute('id', '_marmot_inspect_mask');
		return o;
	})(),
	_eleSelectHandler: null,
	preventDefault: function(event) {
		event.preventDefault();
		event.stopPropagation();
		return false;
	},
	domInspect: function(callback) {
		this._eleSelectHandler = callback || (function(){
			if (Rabbit._is_inspect)	Rabbit.domInspect(function(){});
			Rabbit.initDashboard();
			Rabbit.focusDashboard(Rabbit._inspect_element);
		});

		this.blurDashboard();

		if (!this._is_inspect) {
			document.addEventListener('mouseover', this.domInspector, true);
			//document.addEventListener('mousedown', this.selectElement, true);
			document.addEventListener('mousedown', this.preventDefault, true);
			document.addEventListener('click', this.selectElement, true);
			this.insertNode(this._target_mask);
			this._is_inspect = true;
			for (var i = 0; i < this.layers.length; i++) {
				this.layers[i].canvas.style.display = 'none';
				this.layers[i].node.getElementsByTagName('checkbox')[0].setAttribute('class', '');
			}
		}	else {
			document.removeEventListener('mouseover', this.domInspector, true);
			document.removeEventListener('mousedown', this.preventDefault, true);
			document.removeEventListener('click', this.selectElement, true);
			this._target_mask.style.left = '0px';
			this._target_mask.style.top = '0px';
			this._target_mask.style.height = '0px';
			this._target_mask.parentNode.removeChild(this._target_mask);
			this._is_inspect = false;
		}
	},
	indegreeCallback: function(r) {
		this.inOutCallback(r, 'pre');
	},
	outdegreeCallback: function(r) {
		this.inOutCallback(r, 'nex');
	},
	inOutCallback: function(r, type) {
		if (r.meta.code == 0) {
			var points = r.data.paths;
			this.hide();
			if (points.length > 0)
				this.singlePathLink(points, this._inspect_element, type);
			else this.message('没有数据');
			this.show();
			this.message('元素图绘制成功');
		} else {
			this.message('元素图绘制失败');
		}
		this.unLoading();
	},
	getPath: function(node, path) {
		path = path || [];
		if (node == document.body || (node.tagName && node.tagName.toUpperCase() == "HTML")) {
			return path;
		};
		if (node.getAttribute && node.getAttribute('id') != '' && node.getAttribute('id') != null) {
			path.push(node.nodeName.toLowerCase() + '.' + node.getAttribute('id'));
			return path;
		};
		if (node.parentNode && node.parentNode.tagName.toUpperCase() !="BODY") {
			path = Marmot.getPath(node.parentNode, path);
		}
		if(node.previousSibling) {
			var count = 1;
			var sibling = node.previousSibling
			do {
				//if(sibling.nodeType == 1 && sibling.nodeName == node.nodeName) {
				if(sibling.nodeType == 1 && sibling.nodeName == node.nodeName) {
					count++;
				}
				sibling = sibling.previousSibling;
			} while(sibling);	
		}
		if(node.nodeType == 1) {
			path.push('~' + (count > 1 ? count : '') + node.nodeName.toLowerCase());
		}
		return path;
	},
	singlePathLink: function(aLink, oEl, type) {
		oEl = oEl || this._inspect_element;
		var tPath = this.getPath(oEl).join('');

		var total = 0;
		var p = [];
		this.pageWidth();
		var pos_cache = {};
		var points_cache = {};
		var paths_cache = {};

		function getp(ele) {
			if (pos_cache[ele]) {
				return pos_cache[ele];
			} else {
				var npos = Rabbit.processPath(ele, 1, 'center');
				if (npos) {
					var p = npos[0] + '*' + npos[1];
					pos_cache[ele] = p;
					//p.push([t[0]+24, t[1]+24]);
					return p;
				}
			}
			return false;
		};
		
		function push(a, b){
			if (a[b]) {
				a[b]++;
			} else {
				a[b] = 1;
			}
		};
		var total = 0;
		for (var i = 0, leni = aLink.length; i < leni; i++) {
			for (var j = 0, lenj = aLink[i].length; j < lenj; j++) {
				var pos = '';
				if (aLink[i][j] != tPath) continue;
				var pos = getp(aLink[i][j]);
				if (!pos) continue;

				push(points_cache, pos);

				if (j > 0 && type && type == 'pre') {
					var pre_pos = getp(aLink[i][j - 1]);
					if (!pre_pos) continue;
					push(points_cache, pre_pos);
					var _p =  pre_pos + '>' + pos;
					push(paths_cache, _p);
					total++;
				}

				if (j < lenj - 1 && type && type == 'nex') {
					var nex_pos = getp(aLink[i][j + 1]);
					if (!nex_pos) continue;
					push(points_cache, nex_pos);
					var _p =  pos + '>' + nex_pos;
					push(paths_cache, _p);
					total++;
				}
			}
		};

		var points = [];
		var paths = [];
		for (var o in points_cache) {
			if (points_cache.hasOwnProperty(o)) {
				var _xy = o.split('*');
				points.push([parseInt(_xy[0]), parseInt(_xy[1]), points_cache[o]]);
			}
		}
		for (var o in paths_cache) {
			if (paths_cache.hasOwnProperty(o)) {
				var _ft = o.split('>');
				var pre = _ft[0].split('*');
				var nex = _ft[1].split('*');
				paths.push([[parseInt(pre[0]), parseInt(pre[1])], [parseInt(nex[0]), parseInt(nex[1])], paths_cache[o]]);
			}
		}
		points.sort(function(a, b) {
			return a[2] - b[2];
		});
		paths.sort(function(a, b) {
			return a[2] - b[2];
		});
		if (paths.length > 0) this.pointTo(paths);
		if (points.length > 0) this.dot(points);
		var marks = [];
		for (var k = 0, lenk = paths.length; k < lenk; k++) {
			var tar = null;
			if (type == 'pre')
				tar = paths[k][0];
			else
				tar = paths[k][1];
			marks.push([tar[0], tar[1], paths[k][2]]);
		}
		if (marks.length > 0) this.mark(marks, total);
	},
	calPath: function(aLink, aPath) {
		var tPath = [];
		this.pageWidth();
		for (var i = 0; i < aPath.length; i++) {
			var ph = this.getPath(aPath[i]).join('');
			tPath.push(ph);
		}
		var stPath = tPath.join('!');

		var n = 0;
		for (var j = 0, lenj = aLink.length; j < lenj; j++) {
			if (aLink[j].join('!').indexOf(stPath) >= 0) n++;
		}

		var points = [];
		var paths = [];
		for (var j = 0; j < tPath.length; j++) {
			var npos = Rabbit.processPath(tPath[j], 1, 'center');
			if (npos) {
				points.push([npos[0], npos[1], 100]);
				if (points.length > 1){
					var pr = points[points.length - 2];
					var ne = points[points.length - 1];
					paths.push([[pr[0], pr[1]], [ne[0], ne[1]], 100]);
				}
			}
		}

		this.pointTo(paths);
		this.dot(points);
		points[0][2] = n;
		this.mark([points[0]], aLink.length);
	},
	indegree: function() {
		this.draw('paths', 'Rabbit.indegreeCallback');
		this.blurDashboard();
	},
	outdegree: function() {
		this.draw('paths', 'Rabbit.outdegreeCallback');
		this.blurDashboard();
	},
	leavedegree: function() {
		this.message('目前尚无数据支持~~');
	},
	_path_trace: [],
	pathTrace: function(el) {
		var t = el;
		Rabbit._path_trace.length = 0;
		this.domInspect(function(event){
			if (event.target == t || event.target.parentNode == t) {
				Rabbit.domInspect(function(){});
				Rabbit.draw('paths', 'Rabbit.calPathCallback');
				return;
			};
			Rabbit._path_trace.push(event.target);
		});
	},
	calPathCallback: function(r) {
		if (r.meta.code == 0) {
			var points = r.data.paths;
			this.hide();
			if (points.length > 0)
				this.calPath(points, this._path_trace);
			else this.message('没有数据');
			this.show();
			this.message('元素图绘制成功');
		} else {
			this.message('元素图绘制失败');
		}
		this.unLoading();
	},
	listen: function () {
		if (document.addEventListener) {
			return function (element, name, handler) {
				element.addEventListener(name, handler, true);
			};
		} else if (document.attachEvent) {
			return function (element, name, handler) {
				element.attachEvent('on' + name, handler);
			};
		}
	}()
};

Rabbit.console()

})();

}