var Biquad = (function ()
{
	var Class = function ()
	{
		this.a0 = this.a1 = this.a2 = this.a3 = this.a4 = 0.0;
		this.x1l = this.x2l = this.y1l = this.y2l = this.x1r = this.x2r = this.y1r = this.y2r = 0.0;
		this.output = new AudioBuffer( bufferSize );
	};
	Class.prototype = {
		lowPass: function ( frequency, sampleRate, bandwidth )
		{
			var omega = 2.0 * Math.PI * frequency / sampleRate;
			var sn = Math.sin( omega );
			var cs = Math.cos( omega );

			var alpha = sn / ( 2.0 * bandwidth );
			var b0 = ( 1.0 - cs ) / 2.0;
			var b1 = 1.0 - cs;
			var b2 = ( 1.0 - cs ) / 2.0;
			var a0 = 1.0 + alpha;
			var a1 = -2.0 * cs;
			var a2 = 1.0 - alpha;

			this.a0 = b0 / a0;
			this.a1 = b1 / a0;
			this.a2 = b2 / a0;
			this.a3 = a1 / a0;
			this.a4 = a2 / a0;
		},
		process: function ( input, from, to )
		{
			for( var i = from; i < to; ++i )
			{
				var li = input.l[ i ];
				var ri = input.r[ i ];

				var lf = this.a0 * li + this.a1 * this.x1l + this.a2 * this.x2l - this.a3 * this.y1l - this.a4 * this.y2l + 1.0e-18 - 1.0e-18;
				var rf = this.a0 * ri + this.a1 * this.x1r + this.a2 * this.x2r - this.a3 * this.y1r - this.a4 * this.y2r + 1.0e-18 - 1.0e-18;

				this.x2l = this.x1l;
				this.x1l = li;
				this.y2l = this.y1l;
				this.y1l = this.output.l[ i ] = lf;

				this.x2r = this.x1r;
				this.x1r = ri;
				this.y2r = this.y1r;
				this.y1r = this.output.r[ i ] = rf;
			}
		}
	};
	return Class;
})();