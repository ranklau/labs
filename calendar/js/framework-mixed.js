/**
 * 一点乱七八糟的代码,一般框架都支持的
 * 这里的代码不要乱加到通用脚本里,我只是随手写的
 * @fileoverview framework-mixed.js
 * @author:{@link mailto:ranklau@gmail.com rank}
 * @last-modified : 2011-8-8
 */

//简单写一个自定义事件
var CustEvent = (function() {	
	var ce = function() {};
	ce.createEvents = function(host, e) {
	
		var events = (typeof(e)=='string') ? e.replace(/\s/, '').split(',') : e,
			map    = host.__events = host.__events || {};	
		
		for (var i=0, l=events.length; i<l; i++) {
			map[events[i]] = map[events[i]] || [];
		}
		
		(typeof host.on!='function') && (host.on = function(type, handler) {
			return map[type].push(handler);
		});
		
		(typeof host.fire!='function') && (host.fire = function(type) {
			var args = Array.prototype.slice.call(arguments, 1),
				hostHandler = host['on'+type];
			(typeof hostHandler=='function') && (hostHandler.apply(host, args));
			for (var i=0, list=map[type], l=list.length; i<l; i++) {
				(list[i] && typeof(list[i])=='function') && list[i].apply(host, args);
			}
		});
	};
	
	return ce;
})();

//获取delegate后的target元素
var eventH = {
	target: function(e) {
		return window.event ? window.event.srcElement : e.target;
	}
};

//继承
var classH = {
    extend : function(cls,p,runCon){
        if(runCon == null) runCon = true;
        var wrapped = function() {   
            if(runCon) p.apply(this, arguments);
            var ret = cls.apply(this, arguments);
            return ret;
        }   
        wrapped.toString = function(){ return cls.toString(); }   
    
        var T = function(){};
        T.prototype = p.prototype;
        wrapped.prototype = new T();
        wrapped.$class = cls;
        wrapped.$super = cls.$super = p;
        wrapped.prototype.constructor = wrapped;

		for(var i in cls.prototype){
			if(cls.prototype.hasOwnProperty(i))
				wrapped.prototype[i] = cls.prototype[i];
		}
        wrapped.extend = function(){
            throw new Error("you maynot apply the same wrapper twice.");
        }
        return wrapped;
	}
}

//简单写一个兼容版的绑定dom事件
//用typedef去做了个hook使mouseenter和mouseleave都能得以兼容所有浏览器
var eventTargetH = (function(){
	var _interface  = window.addEventListener ? 'addEventListener' : 'attachEvent';
	var _typedefined = {};
	var _type       = function(type) { 
		type = _typedefined[type] ? _typedefined[type].name : type;
		return (_interface=='attachEvent') ? 'on'+type : type; 
	};
	var _typedef    = function (name, newname, handler) { 
		_typedefined[newname] = { name: name, handler: handler };
	};
	var _handler    = function(el, type, handler) { 
		return _typedefined[type] ? function(e) {
			return _typedefined[type].handler.call(el, e, handler);
		} : function(e) {return handler.call(el, e)};
	};
	
	_typedef('mouseover', 'mouseenter', function(e, handler) {
        var el = this, target = e.relatedTarget || e.fromElement || null;
        if (!target || target == el || dom.contains(el, target)) { return null; }
        return handler.call(el, e);
	});
	_typedef('mouseout', 'mouseleave', function (e, handler) {
        var el = this, target = e.relatedTarget || e.toElement || null;
        if (!target || target == el || dom.contains(el,target)) { return null; }
        return handler.call(el, e);
    });
    
	return {
		on: function(el, type, handler, capture) {
			fn   = _handler(el, type, handler);
			type = _type(type);
			return el[_interface](type, fn, capture||false);
		}
	};
})();

//dom的一些必要兼容
var dom = {
	create: function() {
        var temp = document.createElement('div'),
            wrap = { 
                option: [ 1, "<select multiple='multiple'>", "</select>" ],
                optgroup: [ 1, "<select multiple='multiple'>", "</select>" ],
                legend: [ 1, "<fieldset>", "</fieldset>" ],
                thead: [ 1, "<table>", "</table>" ],
                tbody: [ 1,"<table>", "</table>" ],
                tfoot : [1,"<table>", "</table>"],
                tr: [ 2, "<table><tbody>", "</tbody></table>" ],
                td: [ 3, "<table><tbody><tr>", "</tr></tbody></table>" ],
                th: [ 3, "<table><tbody><tr>", "</tr></tbody></table>" ],
                col: [ 2, "<table><tbody></tbody><colgroup>", "</colgroup></table>" ],
                _default: [ 0, "", "" ]
            },  
           tagName = /<(\w+)/i;
        return function(html, rfrag, doc) {
            var dtemp = (doc && doc.createElement('div')) || temp,
                root = dtemp,
                tag = ( tagName.exec( html ) || ["",""] )[1],
                wr = wrap[ tag ] || wrap[ '_default' ],
                dep = wr[0];
            dtemp.innerHTML = wr[1] + html + wr[2];
            while( dep-- ) {
                dtemp = dtemp.firstChild;
            }
            var el = dtemp.firstChild;
            if (!el || !rfrag) {
                while (root.firstChild) {
                    root.removeChild(root.firstChild);
                }
                return el;
            } else {
                doc = doc || document;
                var frag = doc.createDocumentFragment();
                while (el = dtemp.firstChild) {
                    frag.appendChild(el);
                }
                return frag;
            }
        };

	}(),
	getOffsets: function(e) {
		  var t = e.offsetTop; var l = e.offsetLeft; var w = e.offsetWidth; var h = e.offsetHeight;
		  while  (e=e.offsetParent) { t += e.offsetTop; l += e.offsetLeft; }; 
			return { top: t, left: l, width: w, height: h, bottom: t+h, right: l+w }
	},
	contains: function(el, target) {
		return el.contains ? el != target && el.contains(target) : !!(el.compareDocumentPosition(target) & 16);
	},
	outerHTML: function() {
		var _isNative = 'outerHTML' in document,
			_node = _isNative ? null : document.createElement('div'),
			_fn   = function(el) {_node.appendChild(el.cloneNode(true));return _node.innerHTML};
		return function (el) {
			_node.innerHTML=='' ? void 0 : _node.innerHTML = '';
			return _isNative ? el.outerHTML : _fn(el);
		}
	}(),
	getElementsByClassName: function(cls, context) {
		context = context || document;
		if (typeof context.getElementsByClassName == 'function') {
			return context.getElementsByClassName(cls);
		}
		var elements = context.getElementsByTagName('*'), result=[];
		for (var i=0, l=elements.length; i<l; i++) {
			if (dom.hasClass(elements[i], cls)) {
				result.push(elements[i]);
			}
		}
		return result;
	},
	removeClass: function(el, cls) {
		cls = cls.replace(/([.*+?^=!:${}()|[\]\/\\])/g, '\\$1');
		el.className = el.className.replace(new RegExp('(?:^|\\s*)' +cls+ '(?:\\s*|$)','g'), '');
		
	},
	hasClass: function(el, cls) {
		cls = cls.replace(/([.*+?^=!:${}()|[\]\/\\])/g, '\\$1');
		return new RegExp('(?:^|\\s)' + cls + '(?:\\s|$)').test(el.className);
	},
	replaceClass: function(el, oldClass, newClass) {
		dom.removeClass(el, oldClass);
		if (newClass!=undefined) dom.addClass(el, newClass);
	},
	addClass: function(el, cls) {
		if (!dom.hasClass(el,cls)) {
			el.className = el.className || '';
			el.className=='' ? el.className=cls : el.className += ' '+cls;
		}
	}
};


//object mix
(typeof Object.mix=='undefined') && (Object.mix = function(dest, src, cover) {
	cover = (cover === false) ? false : true; //cover parameter default is true
	for (key in src) {
		if (!cover && (key in dest)) continue;
		dest[key] = src[key];
	}
	return dest;
});

//parseDate的作用是将一个字符串parse成一个Date对象
var parseDate = function(source) {
	var reg = new RegExp("^\\d+(\\-|\\/)\\d+(\\-|\\/)\\d+\x24");
    if ('string' == typeof source) {
        if (reg.test(source) || isNaN(Date.parse(source))) {
            var d = source.split(/ |T/),
                d1 = d.length > 1 ? d[1].split(/[^\d]/) : [0, 0, 0], 
                d0 = d[0].split(/[^\d]/);
            return new Date(d0[0] - 0, d0[1] - 1, d0[2] - 0, d1[0] - 0, d1[1] - 0, d1[2] - 0); 
        } else {
            return new Date(source);
        }   
    }   
    return new Date();
};

//将Date对象格式成字符串
var formatDate = function(d, pattern) {
	pattern=pattern||"yyyy-MM-dd";
    var y=d.getFullYear();
    var o = { 
        "M" : d.getMonth()+1, //month
        "d" : d.getDate(),    //day
        "h" : d.getHours(),   //hour
        "m" : d.getMinutes(), //minute
        "s" : d.getSeconds() //second
    }   
    pattern = pattern.replace(/(y+)/ig, function(a,b){
    	var len = Math.min(4,b.length);
    	return (y+"").substr(4-len);
    });
    
    for(var i in o){ 
        pattern=pattern.replace(new RegExp("("+i+"+)","g"),function(a,b){
        	return (o[i]<10 && b.length>1 )? "0"+o[i] : o[i]
        });
    }   
    return pattern;
};
if (typeof Date.prototype.format != 'function') {
	Date.prototype.format = function(pattern) {
		return formatDate.apply(this, [this, pattern]);
	};
}

/**
 * 在控制台当中(如果有的话),打印log信息,方便调试找到问题
 * @param {String} msg 打印log信息
 * @return void
 */
var log = function(msg) {
	var msie = /msie/.test(navigator.userAgent.toLowerCase());
	( (!msie) && typeof(console)!='undefined' ) ? console.log('iCalendar debug:' +msg) : void 0;
};