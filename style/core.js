
//简单的写一个驼峰化字符串
function camelize(str) {
	return (str||'').toString().replace(/-([a-z])/g, function(a, m) {
		return m.toUpperCase();
	});
};

//只是为了方便,这是浮云
String.prototype.camelize = function() {
	return camelize(this);
};


var ua = navigator.userAgent,
	browser = {
		'ie': /msie/i.test(ua),
		'firefox': /firefox/i.test(ua),
		'webkit': /webkit/i.test(ua),
		'opera': /opera/i.test(ua)
	};



/**
 * Style Object
 * 兼容不同浏览器的style.get和style.set
 * 支持css 3部分功能,可以较灵活扩展
 */
var Style = (function (el, css) {
	
	//尝试一种针对标准配置的方式,类似base2
	//取值潜规则
	//1.对应在map中浏览器中修正的属性值
	//2.修正的读写器（一定要为函数）
	//2.配置map中浏览器对应的default值
	//3.最后用传参过来的默认值
	//为不同浏览器配置属性的hash
	//如果是纯属性值结构为
	//'property': {
	//	'browser': 'property-value'
	//	'default': 'default-value'
	//}
	//如果是读写器函数，结构为
	//'property': {
	//	'browser': {
	//		set: function(el, css, value) {}
	//		get: function(el, css, value) {}
	//	}
	//}
	var propMap = {
	
		'transition': {
			'ie': '-ms-transition',
			'webkit': '-webkit-transition',
			'firefox': '-moz-transition',
			'opera': '-o-transition'
		},
		
		'transform': {
			'ie': '-ms-transform',
			'webkit': '-webkit-transform',
			'firefox': '-moz-transform',
			'opera': '-o-transform'
		},
		
		'float': {
			'default': 'cssFloat'
		},
		
		'rotate': {
			'ie': {
				set: function(el, css, value) {}
			},
			'default': {}
		},
		
		'opacity': {
			'ie': {
				set: function(el, css, value) {
					value = parseFloat(value) || 1;
					var styleObject = el.style;
					
					//如果设置的透明度为1时，IE里去除alpha通道的滤镜
					var result = (1 != value) ? 'alpha(opacity=' +(value*100)+ ')' : '';
					styleObject.filter = (styleObject.filter||'').replace(/alpha\(opacity=(.*)\)/gi, '') +result;
					
					//IE里filter需要触发hasLayout属性
					styleObject.zoom = 1; 
					return value;
				},
				get: function(el, css, presudo) {
					var result = '';
					if (result = (Style.get(el, 'filter') || '').match(/opacity=(.*)/i)) {
						if (result && result[1]) {
							return parseInt(result[1], 10)/100;
						}
					}
					return 1.0;
				}
			},
			'default': {
				get: function(el, css, presudo) {
					//修正在非IE情况下，没有设置opacity时为null
					//在这里作修正opacity为null时修正为1
					return Style.getCurrentStyle.apply(this, arguments) || 1;
				},
				set: function(el, css, value) {
					result = (1==value) ? null : value;
					el.style.opacity = result;
					return value;
				}
			}
		}
	};
	
	//通过css去map中找到对应的项，并返回正确的属性或函数
	var _fixcssHandler = function(css, type) {
		var node   = null,
			result = css;
		
		for (browserName in browser) {
		
			//如果命中配置的浏览器并且如果在cssHash中命中配置
			if (browser[browserName] && propMap[css]) {
				
				//取值潜规则
				//1.对应在map中浏览器中修正的属性值
				//2.修正的读写器（一定要为函数）
				//2.配置map中浏览器对应的default值
				//3.最后用传参过来的默认值
				node = propMap[css][browserName];
				node = node || propMap[css]['default'] || css;

				//如果有读写器，读写器一定要是函数
				if (node && 'function' == typeof(node[type])) {
					result = node[type];
				} else {
					//如果读到的节点值为字符串才可赋值，否则用默认值
					result = (typeof(node) == 'string') ? node : css;
				}
			}
		}
		
		return result;
	};
	
	
	return {
	
		/**
		 * 设置元素的样式
		 * @param {HTMLElement} el HTML元素
		 * @param {String} css css属性
		 * @param {String} value 属性值
		 * @return {mixed} 返回设置的属性值
		 */
		set: function(el, css, value) {
			css = css.camelize();
			var result = _fixcssHandler(css, 'set');
			if ('function' == typeof(result)) {
				return result.apply(this, arguments);
			} else {
				return el.style[result] = value;
			}
		},
		
		/**
		 * 得到元素的样式
		 * @param {HTMLElement} el HTML元素
		 * @param {String} css css属性
		 * @param {String} presudo 伪类
		 * @return {mixed} 返回取到的样式属性值
		 */
		get: function(el, css, presudo) {
		
			css = css.camelize();
			var result = _fixcssHandler(css, 'get');
			if ('function' == typeof(result)) {
				return result.apply(this, arguments);
			} else {
				return Style.getCurrentStyle(el, result, presudo);
			}
		},
		
		/**
		 * 得到元素的currentStyle,只支持标准用法,不同浏览器的兼容
		 * 请用Style.get方法
		 * @param {HTMLElement} el HTML元素
		 * @param {String} css css属性
		 * @param {String} presudo 伪类
		 * @seealso Style.get
		 * @return {mixed} 返回取到的style属性值
		 */
		getCurrentStyle: function(el, css, presudo) {
			css = css.camelize();
			var styleObject = el.currentStyle;
			
			if (el.ownerDocument && el.ownerDocument.defaultView &&
				el.ownerDocument.defaultView.getComputedStyle) {
				styleObject = el.ownerDocument.defaultView.getComputedStyle(el, presudo||null);
				//return styleObject.getPropertyValue(css); 
				//用这个方法浏览器的专有属性值没有办法取到
				//例如transition等css3的属性
			}
			return (styleObject[css] || null);
		}
	}
})();