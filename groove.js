var Groove = (function ()
{
	var Class = function ( fx, fy, duration )
	{
		this.fx = fx;
		this.fy = fy;
		this.duration = duration;
	};
	Class.prototype = {
		forward: function ( position ) // Apply groove function
		{
			var start = Math.floor( position / this.duration ) * this.duration;
			var normalized = ( position - start ) / this.duration;
			var transformed = this.fx( normalized );
			return start + transformed * this.duration;
		},
		inverse: function ( position ) // Inverse groove function to transform search window
		{
			var start = Math.floor( position / this.duration ) * this.duration;
			var normalized = ( position - start ) / this.duration;
			var transformed = this.fy( normalized );
			return start + transformed * this.duration;
		},
		fragmentTime: function ( from, to, scale )
		{
			var grooveFrom = this.inverse( from );
			var grooveTo = this.inverse( to );
			var index = Math.floor( grooveFrom / scale );
			var position = index * scale;
			var events = [];
			while( position < grooveTo )
			{
				if( position >= grooveFrom )
					events.push( {
						position: this.forward( position ),
						index: index
					} );
				position = ++index * scale;
			}
			return events;
		}
	};
	return Class;
})();

Groove.Identity = new Groove(
		function ( x ) {return x;},
		function ( y ) {return y;},
		1.0
);

Groove.Shuffle = (function ()
{
	var Class = function ( amount, duration )
	{
		this.amount = amount;
		this.duration = duration;
	};

	var prototype = Class.prototype = new Groove( this.fx, this.fy, this.duration );
	prototype.fx = function ( x ) { return Math.pow( x, ( 1.0 - this.amount ) * 2.0 ) };
	prototype.fy = function ( y ) { return Math.pow( y, 0.5 / ( 1.0 - this.amount ) ) };

	return Class;
})();