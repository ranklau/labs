# 中文文章格式转换模块

用 NodeJS 写的一个中文文章格式转换器，功能如下：

* 中文文字与英文、阿拉伯数字及 @ # $ % ^ & * . ( ) 等符号之间加空格
* 用直角引号（「」）代替双引号（“”）

如果你想加规则，也很简单，只需要在
fmt.rules 里写函数就行。

使用也很简单，可以用 CLI，也可以用作模块：

* CLI。 Usage: node format.js dir/file [dest]。
* 模块。require('format').format(src[, dest])。