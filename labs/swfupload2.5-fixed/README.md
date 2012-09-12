# swfupload v2.5beta的改进版

debug过程可以从 http://www.never-online.net/blog 里搜索关键词swfupload。

## swfupload v2.5beta已知问题
* flash 10使用bitmapdata有像素限制，不能大于1600w像素
* 使用alchemy技术在IE下速度很慢
* 没有preload（即没有loading动画）

## fixed版解决的问题
* flash 10使用bitmapdata有像素限制，不能大于1600w像素(已解决)
* 使用alchemy技术在IE下速度很慢（已解决）
速度大概提高5~倍，平均上传速度在1s以内就可以成功。IE平均3～4s。

