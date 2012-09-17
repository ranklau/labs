/*
 * http://code.google.com/p/sync-to-async/ -- Apache 2.0 License
 */

// FIXME -- handler errors for the loader and file_reference objects

package  
{
	import flash.display.Bitmap;
	import flash.display.BitmapData;
	import flash.display.Loader;
	import flash.errors.IOError;
	import flash.events.ErrorEvent;
	import flash.events.Event;
	import flash.events.IOErrorEvent;
	import flash.events.EventDispatcher;
	import flash.filters.BitmapFilter;
	import flash.filters.BitmapFilterQuality;
	import flash.filters.BlurFilter;
	import flash.geom.Matrix;
	import flash.geom.Point;
	import flash.geom.Rectangle;
	import flash.net.FileReference;
	import flash.utils.ByteArray;
	//import cmodule.aircall.CLibInit;
	//import AlchemyImageCompressor;
	//import JPEGEncoder;
	import by.blooddy.crypto.image.JPEGEncoder;
	
	import flash.utils.setInterval;
	import flash.utils.clearInterval;

	/*
	Technique adapted from Kun Janos (http://kun-janos.ro/blog/?p=107)
	*/
	public class ImageResizer extends EventDispatcher
	{
		private var file:FileItem = null;
		private var targetWidth:Number = 0;
		private var targetHeight:Number = 0;
		private var newWidth:Number = 1;
		private var newHeight:Number = 1;
		private var encoder:Number = ImageResizer.JPEGENCODER;
		private var quality:Number = 100;
		private var allowEnlarging:Boolean = true;
		private var progressMonitor:Number = 0;
		
		public static const JPEGENCODER:Number = -1;
		public static const PNGENCODE:Number = -2;
		
		public function ImageResizer(file:FileItem, targetWidth:Number, targetHeight:Number, encoder:Number, quality:Number = 100, allowEnlarging:Boolean = true) {
			this.file = file;
			this.targetHeight = targetHeight;
			this.targetWidth = targetWidth;
			this.encoder = encoder;
			this.quality = quality;
			this.allowEnlarging = allowEnlarging;
			
			if (this.encoder != ImageResizer.JPEGENCODER && this.encoder != ImageResizer.PNGENCODE) {
				this.encoder = ImageResizer.JPEGENCODER;
			}
			if (this.quality < 0 || this.quality > 100) {
				this.quality = 100;
			}
		}
		
		public function ResizeImage():void {
			try {
				this.file.file_reference.addEventListener(Event.COMPLETE, this.fileLoad_Complete);
				this.file.file_reference.load();
			} catch (ex:Error) {
				this.file.file_reference.removeEventListener(Event.COMPLETE, this.fileLoad_Complete);
				dispatchEvent(new ErrorEvent(ErrorEvent.ERROR, false, false, "Loading from file reference: " + ex.message));
				this.file = null;
			}
		}
		
		private function fileLoad_Complete(event:Event):void {
			try {
				event.target.removeEventListener(Event.COMPLETE, this.fileLoad_Complete);
				
				var loader:Loader = new Loader();
				
				// Load the image data, resizing takes place in the event handler
				loader.contentLoaderInfo.addEventListener(Event.COMPLETE, this.loader_Complete);
				loader.contentLoaderInfo.addEventListener(IOErrorEvent.IO_ERROR, this.loader_Error);
				this.debug("fileLoad_complete!")
				loader.loadBytes(FileReference(event.target).data);
			} catch (ex:Error) {
				loader.removeEventListener(Event.COMPLETE, this.loader_Complete);
				dispatchEvent(new ErrorEvent(ErrorEvent.ERROR, false, false, "Loading Loader" + ex.message));
				this.file = null;
			}
		}
		private function debug(msg:String):void {
			//ExternalCall.Debug('console.log',msg);
		}
		
		private function consoleTime(k:String):void {
			//ExternalCall.Debug('console.time', k);
		}
		
		private function consoleTimeEnd(k:String):void {
			
			//ExternalCall.Debug('console.timeEnd', k);
		}
		
		private function loader_Error(event:IOErrorEvent):void {
			try {
				event.target.removeEventListener(Event.COMPLETE, this.loader_Complete);
				event.target.removeEventListener(IOErrorEvent.IO_ERROR, this.loader_Error);
			} catch (ex:Error) {}

			dispatchEvent(new ErrorEvent(ErrorEvent.ERROR, false, false, "Resizing: " + event.text));
		}
		
		private function loader_Complete(event:Event):void {
			try {
				var bytes:ByteArray;
				
				event.target.removeEventListener(Event.COMPLETE, this.loader_Complete);
				event.target.removeEventListener(IOErrorEvent.IO_ERROR, this.loader_Error);

				var loader:Loader = Loader(event.target.loader);

				var contentType:String = loader.contentLoaderInfo.contentType;
				
				// Calculate the new image size
				var targetRatio:Number = this.targetWidth / this.targetHeight;
				var imgRatio:Number = loader.width / loader.height;
				this.newHeight = (targetRatio > imgRatio) ? this.targetHeight : Math.min(this.targetWidth / imgRatio, this.targetHeight);
				this.newWidth = (targetRatio > imgRatio) ? Math.min(imgRatio * this.targetHeight, this.targetWidth) : this.targetWidth;
				
				var resizedBmp:BitmapData = null;
				
				// Get the image data
				var bmp:BitmapData = Bitmap(loader.content).bitmapData;
				
				loader.unload();
				loader = null;

				// If enlarging is not allowed but the new width causes enlarging then adjust the dimensions
				if (!this.allowEnlarging && (this.newWidth > bmp.width || this.newHeight > bmp.height)) {
					this.newWidth = bmp.width;
					this.newHeight = bmp.height;
				}
				
				this.debug("bmp width: " +bmp.width); 
				this.debug("bmp height: " +bmp.height);
				
				this.debug("img width: " +this.newWidth);
				this.debug("img height: " +this.newHeight);
				// Blur it a bit if it is sizing smaller
				//if (this.newWidth < bmp.width || this.newHeight < bmp.height) {
				if (bmp.width * bmp.height < 0x01000000) {
					// Apply the blur filter that helps clean up the resized image result
					
					/*
					 * flash里的bug，blurFilter里的像素点已经超过1700万像素则会报#2015的异常
					 * 所以在此处需要把blurFilter的功能给去除;
					 http://help.adobe.com/en_US/FlashPlatform/reference/actionscript/3/flash/display/BitmapData.html
					 * 为了提高性能可以把blurFilter去除 by rank
					
					var blurMultiplier:Number = 1.15; // 1.25;
					var blurXValue:Number = Math.max(1, bmp.width / this.newWidth) * blurMultiplier;
					var blurYValue:Number = Math.max(1, bmp.height / this.newHeight) * blurMultiplier;
					
					var blurFilter:BlurFilter = new BlurFilter(blurXValue, blurYValue, int(BitmapFilterQuality.LOW));
					bmp.applyFilter(bmp, new Rectangle(0, 0, bmp.width, bmp.height), new Point(0, 0), blurFilter);
					 */
				}

				if (this.newWidth < bmp.width || this.newHeight < bmp.height || this.IsTranscoding(contentType)) {
					// Apply the resizing
					
					this.debug("apply resize");
					var matrix:Matrix = new Matrix();
					matrix.identity();
					matrix.createBox(this.newWidth / bmp.width, this.newHeight / bmp.height);

					resizedBmp = new BitmapData(this.newWidth, this.newHeight, true, 0x000000);
					resizedBmp.draw(bmp, matrix, null, null, null, true);
					
					matrix = null;
					bmp.dispose(); //by rank
					
					if (this.encoder == ImageResizer.PNGENCODE) {
						var pngEncoder:PNGEncoder = new PNGEncoder(PNGEncoder.TYPE_SUBFILTER, 1);
						pngEncoder.addEventListener(EncodeCompleteEvent.COMPLETE, this.EncodeCompleteHandler);
						pngEncoder.addEventListener(ErrorEvent.ERROR, this.EncodeErrorHandler);
						pngEncoder.encode(resizedBmp);
					} else {	
						this.baOut = by.blooddy.crypto.image.JPEGEncoder.encode( resizedBmp, this.quality );
						this.EncodeCompleteHandler(new EncodeCompleteEvent(baOut));
					}
				} else {
					// Just send along the unmodified data
					dispatchEvent(new ImageResizerEvent(ImageResizerEvent.COMPLETE, this.file.file_reference.data, this.encoder));
				}
				
			} catch (ex:Error) {
				dispatchEvent(new ErrorEvent(ErrorEvent.ERROR, false, false, "Resizing: " + ex.message));
			}
			
			this.file = null;
		}

		private function IsTranscoding(type:String):Boolean {
			return !((type == "image/jpeg" && this.encoder == ImageResizer.JPEGENCODER) || (type == "image/png" && this.encoder == ImageResizer.PNGENCODE));
		}
		
		private function EncodeErrorHandler(e:ErrorEvent):void {
			dispatchEvent(e);
		}
		
		private function EncodeProgress():void {
			this.debug("Encoding progress: " + Math.round(this.ba.position/this.ba.length*100) + "%");
		}

		private var ba:ByteArray;
		private var baOut:ByteArray;
		private function compressFinished(out:ByteArray):void {
			this.baOut.position = 0;
			this.ba.length = 0;
			this.debug("clib compress completely.")
			this.EncodeCompleteHandler(new EncodeCompleteEvent(baOut));
		}
		
		private function EncodeCompleteHandler(e:EncodeCompleteEvent):void {
			dispatchEvent(new ImageResizerEvent(ImageResizerEvent.COMPLETE, e.data, this.encoder));
			//clearInterval(progressMonitor);
		}
		
	}
	
}