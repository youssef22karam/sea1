
NS.Wheelhouse=(()=>{
const {BufferGeometry, CircleGeometry, Color, Float32BufferAttribute, Matrix4, PlaneGeometry, Vector2, Vector3} = ENG;
const {slab, loft, fanCap, box, roundedBox, cylinder, rod, sphere, torus, lathe, tube, prepare, mat4, alignY, auxVertices, paintVertices, mergePrepared,} = NS.GeoKit;
const {houseHalfWidth, foredeckY, PALETTE} = NS.HullBuilder;
const {lerp} = NS.HullLines;
const {buoyGeometry} = NS.DeckGear;

const V = ( x, y, z ) => new Vector3( x, y, z );

// Wheelhouse dimensions (boat frame)
const HOUSE = {
	wallT: 0.045,
	wsBottomY: 1.48, // windshield base
	wsTopY: 2.24,
	roofUnderY: 2.31,
	roofZ0: - 0.95,
	roofZ1: 1.34,
	winBottom: 1.56,
	winTop: 2.12,
	dash: { zFace: 0.98, yKnee: 1.08, zTop: 1.16, yTop: 1.4, zBack: 1.41, halfW: 1.1 },
	helmX: - 0.55,
	seatZ: 0.22,
};

const STAINLESS = { color: PALETTE.stainless, rough: 0.22, metal: 1 };
const BLACK_PLASTIC = { color: 0x1a1b1d, rough: 0.55, metal: 0 };
const WHITE_PAINT = { color: 0xf1f0eb, rough: 0.35, metal: 0 };
const FRAME = { color: 0xa4a8ab, rough: 0.55, metal: 1 }; // weathered, oxidised aluminium
const VINYL = { color: 0x1f2a3a, rough: 0.6, metal: 0 };

function wsZ( L, y ) {

	return L.houseFront - ( y - HOUSE.wsBottomY ) * ( 0.25 / 0.76 );

}

function wallX( L, z, y ) {

	return houseHalfWidth( L, z ) - Math.max( 0, y - 1.15 ) * 0.04;

}

function roofTopY( x ) {

	return 2.375 + 0.035 * ( 1 - ( x / 1.35 ) ** 2 );

}

// Offset a convex polygon (list of [u, v]) outward by d.
function offsetPoly( poly, d ) {

	const n = poly.length;
	const ccw = area2( poly ) > 0;
	const lines = [];
	for ( let i = 0; i < n; i ++ ) {

		const a = poly[ i ], b = poly[ ( i + 1 ) % n ];
		const ex = b[ 0 ] - a[ 0 ], ey = b[ 1 ] - a[ 1 ];
		const l = Math.hypot( ex, ey );
		let nx = ey / l, ny = - ex / l; // right-hand normal (outward for CCW)
		if ( ! ccw ) {

			nx = - nx; ny = - ny;

		}

		lines.push( [ a[ 0 ] + nx * d, a[ 1 ] + ny * d, ex, ey ] );

	}

	const out = [];
	for ( let i = 0; i < n; i ++ ) {

		const l1 = lines[ ( i + n - 1 ) % n ], l2 = lines[ i ];
		const den = l1[ 2 ] * l2[ 3 ] - l1[ 3 ] * l2[ 2 ];
		const s = ( ( l2[ 0 ] - l1[ 0 ] ) * l2[ 3 ] - ( l2[ 1 ] - l1[ 1 ] ) * l2[ 2 ] ) / den;
		out.push( [ l1[ 0 ] + l1[ 2 ] * s, l1[ 1 ] + l1[ 3 ] * s ] );

	}

	return out;

}

function area2( poly ) {

	let a = 0;
	for ( let i = 0; i < poly.length; i ++ ) {

		const p = poly[ i ], q = poly[ ( i + 1 ) % poly.length ];
		a += p[ 0 ] * q[ 1 ] - q[ 0 ] * p[ 1 ];

	}

	return a;

}

// Quad from four corner points (counter-clockwise seen from the front) with 0..1 or metric UVs.
function quad( a, b, c, d, uvs = [ 0, 0, 1, 0, 1, 1, 0, 1 ] ) {

	const g = new BufferGeometry();
	g.setAttribute( 'position', new Float32BufferAttribute( [ a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z, d.x, d.y, d.z ], 3 ) );
	g.setAttribute( 'uv', new Float32BufferAttribute( uvs, 2 ) );
	g.setIndex( [ 0, 1, 2, 0, 2, 3 ] );
	g.computeVertexNormals();
	return g;

}

function buildWheelhouse( kit, L, parts ) {

	buildWalls( kit, L );
	buildWindshield( kit, L );
	buildRoof( kit, L );
	buildConsole( kit, L, parts );
	buildSeating( kit, L );
	buildCabinDetail( kit, L );
	buildRoofGear( kit, L, parts );

}

// ------------------------------------------------------------------ side walls

function sideWindowHoles( L ) {

	const { winBottom: y0, winTop: y1 } = HOUSE;
	const front = ( y ) => wsZ( L, y ) - 0.1;
	return [
		[ [ 0.3, y0 ], [ 0.78, y0 ], [ 0.78, y1 ], [ 0.3, y1 ] ],
		[ [ 0.84, y0 ], [ front( y0 ), y0 ], [ front( y1 ), y1 ], [ 0.84, y1 ] ],
	];

}

function buildWalls( kit, L ) {

	const { wallT, roofUnderY } = HOUSE;
	const z0 = L.houseBack, z1 = L.houseFront;
	const outline = [];
	const NB = 8;
	for ( let i = 0; i <= NB; i ++ ) {

		const z = lerp( z0, z1, i / NB );
		outline.push( [ z, L.sheerY( L.tAtSheerZ( z ) ) ] );

	}

	outline.push( [ z1, HOUSE.wsBottomY ] );
	outline.push( [ wsZ( L, roofUnderY ), roofUnderY ] );
	outline.push( [ z0, roofUnderY ] );
	const holes = sideWindowHoles( L );

	for ( const s of [ 1, - 1 ] ) {

		const map = ( u, v, side ) => V( s * ( wallX( L, u, v ) - side * wallT ), v, u );
		// the inner face is painted panelling (seams, screws, grime); the outside stays glossy gelcoat
		const wall = slab( outline, holes, map );
		auxVertices( wall, ( p ) => Math.abs( p.x ) < wallX( L, p.z, p.y ) - wallT * 0.5 ? [ 0.5, 0, 2, 0 ] : [ 0.3, 0, 0, 0 ] );
		kit.add( 'gelcoat', wall, { color: PALETTE.gelcoat } );

		for ( const h of holes ) {

			// aluminum frame ring through the wall, proud of both faces
			const outer = offsetPoly( h, 0.024 );
			const fmap = ( u, v, side ) => V( s * ( wallX( L, u, v ) + 0.008 - side * ( wallT + 0.016 ) ), v, u );
			kit.add( 'fittings', slab( outer, [ offsetPoly( h, - 0.006 ) ], fmap ), FRAME );

			// (no glass in the openings: the windows are left open)

			// black rubber gasket lining the opening, inside the frame ring
			const gmap = ( u, v, side ) => V( s * ( wallX( L, u, v ) + 0.004 - side * ( wallT + 0.008 ) ), v, u );
			kit.add( 'fittings', slab( offsetPoly( h, - 0.005 ), [ offsetPoly( h, - 0.014 ) ], gmap ), { color: 0x0e0f10, rough: 0.8 } );

			// pop rivets around the frame on the inside face
			const ring = offsetPoly( h, 0.011 );
			for ( let i = 0; i < ring.length; i ++ ) {

				const a = ring[ i ], b = ring[ ( i + 1 ) % ring.length ];
				const len = Math.hypot( b[ 0 ] - a[ 0 ], b[ 1 ] - a[ 1 ] );
				const n = Math.max( 2, Math.round( len / 0.075 ) );
				for ( let k = 0; k < n; k ++ ) {

					const u = lerp( a[ 0 ], b[ 0 ], ( k + 0.5 ) / n ), v = lerp( a[ 1 ], b[ 1 ], ( k + 0.5 ) / n );
					const xr = s * ( wallX( L, u, v ) + 0.008 - ( wallT + 0.016 ) - 0.001 );
					const rv = cylinder( 0.0045, 0.0045, 0.003, 6 );
					rv.applyMatrix4( mat4( xr, v, u, 0, 0, Math.PI / 2 ) );
					kit.add( 'fittings', rv, { color: 0xc9ccd0, rough: 0.35, metal: 1 } );

				}

			}

		}

		// sliding-window latch
		const lz = 0.81, ly = 1.84;
		const lb = box( 0.02, 0.06, 0.025 );
		lb.translate( s * ( wallX( L, lz, ly ) - wallT - 0.012 ), ly, lz );
		kit.add( 'fittings', lb, BLACK_PLASTIC );

	}

	// house front below the windshield (coaming)
	const tF = L.tAtSheerZ( L.houseFront );
	const hw = houseHalfWidth( L, L.houseFront );
	const cOutline = [];
	for ( let i = 0; i <= 10; i ++ ) {

		const x = lerp( - hw, hw, i / 10 );
		cOutline.push( [ x, foredeckY( L, tF, x ) - 0.012 ] );

	}

	cOutline.push( [ hw, HOUSE.wsBottomY ], [ - hw, HOUSE.wsBottomY ] );
	const coaming = slab( cOutline, [], ( u, v, side ) => V( u, v, L.houseFront - side * 0.04 ) );
	auxVertices( coaming, ( p ) => p.z < L.houseFront - 0.02 ? [ 0.5, 0, 2, 0 ] : [ 0.3, 0, 0, 0 ] );
	kit.add( 'gelcoat', coaming, { color: PALETTE.gelcoat } );

}

// ------------------------------------------------------------------ windshield

function buildWindshield( kit, L ) {

	const { wsBottomY, roofUnderY } = HOUSE;
	const rake = new Vector3( 0, 0.76, - 0.25 ).normalize();
	const normal = new Vector3( 0, 0.25, 0.76 ).normalize();
	const base = V( 0, wsBottomY, L.houseFront );
	const vTop = ( roofUnderY - wsBottomY ) / rake.y;
	const at = ( u, v ) => base.clone().addScaledVector( rake, v ).setX( u );
	const halfAt = ( v ) => {

		const p = at( 0, v );
		return wallX( L, p.z, p.y );

	};

	const xb = halfAt( 0 ), xt = halfAt( vTop );
	const outline = [ [ - xb, 0 ], [ xb, 0 ], [ xt, vTop ], [ - xt, vTop ] ];
	const v0 = 0.07, v1 = 0.75;
	const holes = [
		[ [ - 0.36, v0 ], [ 0.36, v0 ], [ 0.36, v1 ], [ - 0.36, v1 ] ],
		[ [ 0.42, v0 ], [ halfAt( v0 ) - 0.09, v0 ], [ halfAt( v1 ) - 0.09, v1 ], [ 0.42, v1 ] ],
		[ [ - 0.42, v0 ], [ - 0.42, v1 ], [ - halfAt( v1 ) + 0.09, v1 ], [ - halfAt( v0 ) + 0.09, v0 ] ],
	];
	const T = 0.05;
	const map = ( u, v, side ) => at( u, v ).addScaledVector( normal, - side * T );
	kit.add( 'gelcoat', slab( outline, holes, map ), { color: PALETTE.gelcoat, rough: 0.3 } );

	for ( const h of holes ) {

		const outer = offsetPoly( h, 0.022 );
		kit.add( 'fittings', slab( outer, [ offsetPoly( h, - 0.006 ) ], ( u, v, side ) => at( u, v ).addScaledVector( normal, 0.008 - side * ( T + 0.016 ) ) ), FRAME );
		// (no glass: open windows)

	}

	// pantograph wipers on the centre and starboard panes
	for ( const [ u, ang ] of [ [ 0.0, 0.25 ], [ - 0.72, 0.2 ] ] ) {

		const pivot = at( u, v0 + 0.03 ).addScaledVector( normal, 0.012 );
		const dir = rake.clone().applyAxisAngle( normal, ang );
		const blade = rod( pivot, pivot.clone().addScaledVector( dir, 0.52 ), 0.006, 5 );
		kit.add( 'fittings', blade, BLACK_PLASTIC );
		kit.add( 'fittings', rod( pivot.clone().addScaledVector( normal, - 0.01 ), pivot.clone().addScaledVector( normal, 0.012 ), 0.014, 8 ), BLACK_PLASTIC );

	}

}

// ------------------------------------------------------------------ roof

function roofHalf( L, z ) {

	const zc = Math.min( Math.max( z, L.houseBack ), 1.18 );
	let hw = wallX( L, zc, HOUSE.roofUnderY ) + 0.09;
	const rc = 0.22;
	const d = Math.min( z - HOUSE.roofZ0, HOUSE.roofZ1 - z );
	if ( d < rc ) hw -= rc - Math.sqrt( Math.max( 0, rc * rc - ( rc - d ) ** 2 ) );
	return hw;

}

function buildRoof( kit, L ) {

	const yb = HOUSE.roofUnderY;
	const N = 22;
	const profiles = [];
	// cluster stations near both ends for the rounded corners, plus a pair on each end wall of the
	// wheelhouse so the headliner pattern (per-vertex aux) switches inside the wall, not across the roof
	const zs = [];
	for ( let i = 0; i <= N; i ++ ) {

		const f = i / N;
		const g = 0.5 - 0.5 * Math.cos( Math.PI * f );
		zs.push( lerp( HOUSE.roofZ0, HOUSE.roofZ1, lerp( f, g, 0.6 ) ) );

	}

	for ( const zw of [ L.houseBack, L.houseFront ] ) for ( const dz of [ - 0.012, 0.012 ] ) {

		const z = zw + dz;
		if ( z > HOUSE.roofZ0 + 0.02 && z < HOUSE.roofZ1 - 0.02 ) zs.push( z );

	}

	zs.sort( ( a, b ) => a - b );
	for ( const z of zs ) {

		const hw = roofHalf( L, z );
		// inner face of the side wall under the roof (the headliner ends there)
		const wIn = wallX( L, Math.min( Math.max( z, L.houseBack ), L.houseFront ), yb ) - HOUSE.wallT;
		const half = [
			[ 0, yb ], [ wIn * 0.5, yb ], [ wIn - 0.01, yb ], [ wIn + 0.01, yb ], [ hw - 0.03, yb ], [ hw - 0.008, yb + 0.008 ], [ hw, yb + 0.025 ],
			[ hw - 0.004, roofTopY( hw ) - 0.012 ], [ hw - 0.02, roofTopY( hw ) ], [ hw * 0.75, roofTopY( hw * 0.75 ) ],
			[ hw * 0.5, roofTopY( hw * 0.5 ) ], [ hw * 0.25, roofTopY( hw * 0.25 ) ], [ 0, roofTopY( 0 ) ],
		];
		const loop = half.map( ( p ) => V( p[ 0 ], p[ 1 ], z ) );
		for ( let k = half.length - 2; k >= 1; k -- ) loop.push( V( - half[ k ][ 0 ], half[ k ][ 1 ], z ) );
		profiles.push( loop );

	}

	const N2 = profiles.length - 1;
	const g = loft( profiles, { closed: true } );
	orientOutwardFn( g, ( p ) => V( p.x, p.y - 2.345, 0 ) );
	metricUV( g, ( p ) => [ p.x, p.z ] );
	// non-skid on top; the underside is headliner over the wheelhouse, gelcoat on the overhangs
	auxVertices( g, ( p ) => {

		if ( p.y > yb + 0.03 ) return [ 0.35, 0, 1, 0 ];
		const inside = p.z > L.houseBack && p.z < L.houseFront && Math.abs( p.x ) < wallX( L, Math.min( Math.max( p.z, L.houseBack ), L.houseFront ), yb ) - HOUSE.wallT;
		return [ 0.35, 0, inside ? 3 : 0, 0 ];

	} );
	kit.add( 'gelcoat', g, { color: PALETTE.gelcoat } );
	kit.add( 'gelcoat', fanCap( profiles[ 0 ], V( 0, 0, - 1 ) ), { color: PALETTE.gelcoat, rough: 0.3 } );
	kit.add( 'gelcoat', fanCap( profiles[ N2 ], V( 0, 0, 1 ) ), { color: PALETTE.gelcoat, rough: 0.3 } );

	// stainless grab rails along the roof edges
	for ( const s of [ 1, - 1 ] ) {

		const x = s * 1.1;
		const y = roofTopY( 1.1 ) + 0.07;
		kit.add( 'fittings', rod( V( x, y, - 0.7 ), V( x, y, 0.95 ), 0.013, 8 ), STAINLESS );
		for ( const z of [ - 0.7, - 0.12, 0.45, 0.95 ] ) kit.add( 'fittings', rod( V( x, roofTopY( 1.1 ) - 0.01, z ), V( x, y, z ), 0.011, 6 ), STAINLESS );

	}

}

function orientOutwardFn( g, fn ) {

	const p = g.attributes.position, n = g.attributes.normal;
	let dot = 0;
	const a = V( 0, 0, 0 ), b = V( 0, 0, 0 );
	for ( let i = 0; i < p.count; i ++ ) {

		a.fromBufferAttribute( p, i ); b.fromBufferAttribute( n, i );
		dot += b.dot( fn( a ) );

	}

	if ( dot < 0 ) {

		const idx = Array.from( g.index.array );
		for ( let i = 0; i < idx.length; i += 3 ) {

			const t = idx[ i + 1 ]; idx[ i + 1 ] = idx[ i + 2 ]; idx[ i + 2 ] = t;

		}

		g.setIndex( idx );
		g.computeVertexNormals();

	}

}

function metricUV( g, fn ) {

	const p = g.attributes.position;
	const uv = new Float32Array( p.count * 2 );
	const v = V( 0, 0, 0 );
	for ( let i = 0; i < p.count; i ++ ) {

		v.fromBufferAttribute( p, i );
		const t = fn( v );
		uv[ i * 2 ] = t[ 0 ]; uv[ i * 2 + 1 ] = t[ 1 ];

	}

	g.setAttribute( 'uv', new Float32BufferAttribute( uv, 2 ) );

}

// ------------------------------------------------------------------ console, helm, instruments

// Slope of the instrument panel (from the knee to the dash top).
function panelFrame() {

	const d = HOUSE.dash;
	const B = new Vector2( d.zFace, d.yKnee ), C = new Vector2( d.zTop, d.yTop );
	const dir = C.clone().sub( B ).normalize(); // (dz, dy)
	const along = V( 0, dir.y, dir.x ); // up the panel
	const normal = V( 0, dir.x, - dir.y ); // toward the helmsman (up and aft)
	const at = ( x, f ) => V( x, lerp( B.y, C.y, f ), lerp( B.x, C.x, f ) );
	return { along, normal, at, length: B.distanceTo( C ), angle: Math.atan2( dir.x, dir.y ) };

}

function buildConsole( kit, L, parts ) {

	const d = HOUSE.dash;
	// console body; its ends follow the hull lining where the flared hull narrows toward the bow
	const corners = [ [ d.zFace, L.deckY ], [ d.zFace, d.yKnee ], [ d.zTop, d.yTop ], [ d.zBack, d.yTop ], [ d.zBack, L.deckY ] ];
	const outline = [];
	for ( let i = 0; i < corners.length; i ++ ) {

		const a = corners[ i ], b = corners[ ( i + 1 ) % corners.length ];
		for ( let k = 0; k < 6; k ++ ) outline.push( [ lerp( a[ 0 ], b[ 0 ], k / 6 ), lerp( a[ 1 ], b[ 1 ], k / 6 ) ] );

	}

	const endX = ( z, y ) => Math.min( d.halfW, L.halfBreadth( L.tAtSheerZ( z ), Math.min( y, L.sheerY( L.tAtSheerZ( z ) ) ) ) - L.shell - 0.004 );
	const body = slab( outline, [], ( u, v, side ) => V( ( side ? - 1 : 1 ) * endX( u, v ), v, u ) );
	auxVertices( body, () => [ 0.5, 0, 2, 0 ] );
	kit.add( 'gelcoat', body, { color: PALETTE.gelcoat } );

	// anti-glare dash top and instrument panel
	const top = box( d.halfW * 2 - 0.01, 0.01, d.zBack - d.zTop );
	top.translate( 0, d.yTop + 0.005, ( d.zBack + d.zTop ) / 2 );
	kit.add( 'gelcoat', top, { color: 0x2a2c2f, rough: 0.85 } );

	const pf = panelFrame();
	const panel = box( d.halfW * 2 - 0.04, pf.length - 0.02, 0.012 );
	panel.applyMatrix4( mat4( 0, 0, 0, pf.angle, 0, 0 ) );
	panel.translate( ...pf.at( 0, 0.5 ).addScaledVector( pf.normal, 0.004 ).toArray() );
	kit.add( 'fittings', panel, { color: 0x1d1f22, rough: 0.7, pattern: 4 } );

	// teak fiddle rail along the dash top edge
	const fr = box( d.halfW * 2 - 0.02, 0.03, 0.022 );
	fr.translate( 0, d.yTop + 0.02, d.zTop + 0.011 );
	kit.add( 'wood', fr, { rough: 0.3 } );

	// gauges (bezel + backlit dial)
	for ( const [ x, f ] of [ [ - 0.76, 0.72 ], [ - 0.34, 0.72 ], [ - 0.55, 0.9 ], [ - 0.12, 0.5 ], [ 0.02, 0.5 ] ] ) {

		const c = pf.at( x, f ).addScaledVector( pf.normal, 0.012 );
		const m = new Matrix4().makeBasis( V( - 1, 0, 0 ), pf.along, pf.normal ).setPosition( c );
		const bezel = torus( 0.043, 0.006, 4, 16 );
		bezel.applyMatrix4( m );
		kit.add( 'fittings', bezel, STAINLESS );
		const dial = new CircleGeometry( 0.042, 20 );
		// 3 mm proud of the panel face (was coplanar with it: z-fighting)
		dial.applyMatrix4( new Matrix4().makeBasis( V( - 1, 0, 0 ), pf.along, pf.normal ).setPosition( c.clone().addScaledVector( pf.normal, 0.001 ) ) );
		kit.add( 'glow', dial, { color: 0xffffff, rough: 0.2, pattern: 3 } );

	}

	// switch panel with rocker switches
	const sw = pf.at( 0.55, 0.45 ).addScaledVector( pf.normal, 0.012 );
	const swm = new Matrix4().makeBasis( V( - 1, 0, 0 ), pf.along, pf.normal ).setPosition( sw );
	const swPlate = box( 0.34, 0.1, 0.008 );
	swPlate.applyMatrix4( swm );
	kit.add( 'fittings', swPlate, { color: 0x2d3036, rough: 0.5, pattern: 4 } );
	const tape = box( 0.3, 0.014, 0.002 );
	tape.applyMatrix4( new Matrix4().makeBasis( V( - 1, 0, 0 ), pf.along, pf.normal ).setPosition( sw.clone().addScaledVector( pf.along, - 0.038 ).addScaledVector( pf.normal, 0.005 ) ) );
	kit.add( 'fittings', tape, { color: 0xffffff, rough: 0.5, pattern: 8 } );
	for ( let i = 0; i < 6; i ++ ) {

		const r = box( 0.03, 0.045, 0.015 );
		r.applyMatrix4( new Matrix4().makeBasis( V( - 1, 0, 0 ), pf.along, pf.normal ).setPosition( sw.clone().add( V( - 0.13 + i * 0.052, 0, 0 ) ).addScaledVector( pf.normal, 0.008 ) ) );
		kit.add( 'fittings', r, { color: 0x111214, rough: 0.4 } );
		const led = box( 0.008, 0.008, 0.004 );
		led.applyMatrix4( new Matrix4().makeBasis( V( - 1, 0, 0 ), pf.along, pf.normal ).setPosition( sw.clone().add( V( - 0.13 + i * 0.052, 0, 0 ) ).addScaledVector( pf.along, 0.035 ).addScaledVector( pf.normal, 0.006 ) ) );
		kit.add( 'glow', led, { color: i % 3 === 0 ? 0x33ff66 : 0xff5522, rough: 0.3, pattern: 6 } );

	}

	// helm: wheel shaft (static) and the wheel pivot (animated part built in BoatModel)
	const hub = pf.at( HOUSE.helmX, 0.45 );
	const center = hub.clone().addScaledVector( pf.normal, 0.14 );
	kit.add( 'fittings', rod( hub.clone().addScaledVector( pf.normal, - 0.01 ), center.clone().addScaledVector( pf.normal, - 0.03 ), 0.02, 10 ), STAINLESS );
	const helmBoss = cylinder( 0.05, 0.055, 0.025, 16 );
	helmBoss.applyMatrix4( alignY( hub.clone().addScaledVector( pf.normal, 0.008 ), pf.normal ) );
	kit.add( 'fittings', helmBoss, { color: 0x2b2d30, rough: 0.5 } );
	parts.wheelCenter = center;
	parts.wheelAxis = pf.normal.clone().negate(); // local +Z of the wheel points into the dash

	// throttle / shift control on the dash top, starboard of the wheel
	const tx = - 0.93, tz = 1.24;
	const tb = roundedBox( 0.1, 0.075, 0.15, 0.015, 1 );
	tb.translate( tx, d.yTop + 0.01 + 0.0375, tz );
	kit.add( 'fittings', tb, BLACK_PLASTIC );
	const tp = box( 0.085, 0.004, 0.13 );
	tp.translate( tx, d.yTop + 0.01 + 0.077, tz );
	kit.add( 'fittings', tp, STAINLESS );
	parts.throttlePivot = V( tx, d.yTop + 0.09, tz );

	// compass binnacle with a glass dome
	const cx = HOUSE.helmX, cz = 1.3;
	const cb = lathe( [ [ 0, 0 ], [ 0.07, 0 ], [ 0.072, 0.02 ], [ 0.062, 0.045 ], [ 0, 0.045 ] ], 20 );
	cb.translate( cx, d.yTop + 0.01, cz );
	kit.add( 'fittings', cb, BLACK_PLASTIC );
	const card = cylinder( 0.05, 0.05, 0.01, 20 );
	card.translate( cx, d.yTop + 0.06, cz );
	kit.add( 'fittings', card, { color: 0x2c2c2a, rough: 0.5 } );
	const lubber = box( 0.004, 0.02, 0.008 );
	lubber.translate( cx, d.yTop + 0.07, cz + 0.045 );
	kit.add( 'fittings', lubber, { color: 0xd0402a, rough: 0.5 } );
	const dome = sphere( 0.058, 20, 8, 0, Math.PI * 2, 0, Math.PI / 2 );
	dome.translate( cx, d.yTop + 0.053, cz );
	kit.add( 'glass', dome );

	// electronics: radar display (centre) and chart plotter (port)
	for ( const [ x, mode ] of [ [ - 0.06, 1 ], [ 0.38, 2 ] ] ) {

		const tilt = 0.3; // lean back so the screen faces the helmsman
		const w = 0.36, h = 0.27;
		const bodyM = mat4( x, d.yTop + 0.01 + h / 2 + 0.03, 1.29, tilt, 0, 0 );
		const body = roundedBox( w, h, 0.07, 0.018, 1 );
		body.applyMatrix4( bodyM );
		kit.add( 'fittings', body, BLACK_PLASTIC );
		const mount = box( 0.1, 0.05, 0.08 );
		mount.translate( x, d.yTop + 0.035, 1.3 );
		kit.add( 'fittings', mount, BLACK_PLASTIC );
		const screen = new PlaneGeometry( w - 0.05, h - 0.06 );
		screen.applyMatrix4( new Matrix4().makeRotationY( Math.PI ) );
		screen.applyMatrix4( mat4( 0, 0.012, - 0.037 ) ); // 2 mm proud of the bezel face
		screen.applyMatrix4( bodyM );
		// PlaneGeometry uvs are flipped horizontally after the Y rotation; restore them
		const uv = screen.attributes.uv;
		for ( let i = 0; i < uv.count; i ++ ) uv.setX( i, 1 - uv.getX( i ) );
		kit.add( 'glow', screen, { color: 0xffffff, rough: 0.15, pattern: mode } );

	}

	// overhead console with VHF radio above the windshield
	const oz = 1.02, oy = HOUSE.roofUnderY - 0.07;
	const oc = roundedBox( 0.9, 0.13, 0.3, 0.02, 1 );
	oc.applyMatrix4( mat4( - 0.15, oy, oz, - 0.25, 0, 0 ) );
	kit.add( 'fittings', oc, { color: 0x24262a, rough: 0.6 } );
	const face = mat4( - 0.15, oy, oz, - 0.25, 0, 0 ); // aft face tilted down toward the helm
	const vhf = box( 0.2, 0.06, 0.02 );
	vhf.applyMatrix4( new Matrix4().makeTranslation( - 0.18, 0, - 0.155 ) );
	vhf.applyMatrix4( face );
	kit.add( 'fittings', vhf, { color: 0x111214, rough: 0.4 } );
	const lcd = new PlaneGeometry( 0.09, 0.03 );
	lcd.applyMatrix4( new Matrix4().makeRotationY( Math.PI ) );
	lcd.applyMatrix4( new Matrix4().makeTranslation( - 0.2, 0.005, - 0.168 ) ); // 3 mm proud of the radio face
	lcd.applyMatrix4( face );
	kit.add( 'glow', lcd, { color: 0x7dff9a, rough: 0.2, pattern: 6 } );
	for ( const k of [ - 0.06, 0.1, 0.26 ] ) {

		const knob = cylinder( 0.012, 0.012, 0.02, 10 );
		knob.applyMatrix4( new Matrix4().makeRotationX( Math.PI / 2 ) );
		knob.applyMatrix4( new Matrix4().makeTranslation( k, 0, - 0.16 ) );
		knob.applyMatrix4( face );
		kit.add( 'fittings', knob, STAINLESS );

	}

	// microphone hanging from the VHF
	const mic = roundedBox( 0.05, 0.08, 0.03, 0.01, 1 );
	mic.translate( - 0.02, oy - 0.2, oz - 0.12 );
	kit.add( 'fittings', mic, BLACK_PLASTIC );
	kit.add( 'fittings', tube( [ V( - 0.05, oy - 0.04, oz - 0.15 ), V( - 0.08, oy - 0.1, oz - 0.14 ), V( - 0.04, oy - 0.14, oz - 0.13 ), V( - 0.02, oy - 0.16, oz - 0.12 ) ], 0.004, 16, 4 ), BLACK_PLASTIC );

	// cabin dome light
	const dl = cylinder( 0.08, 0.085, 0.012, 20 );
	dl.translate( 0, HOUSE.roofUnderY - 0.006, 0.42 );
	kit.add( 'glow', dl, { color: 0xffe6b8, rough: 0.4, pattern: 5 } );

	// cuddy door in the console face (port side)
	const door = box( 0.5, 0.62, 0.01 );
	door.translate( 0.55, 0.72, d.zFace - 0.004 );
	kit.add( 'fittings', door, { color: 0x121315, rough: 0.9 } );
	for ( const [ w, h, x, y ] of [ [ 0.56, 0.03, 0.55, 1.045 ], [ 0.56, 0.03, 0.55, 0.395 ], [ 0.03, 0.68, 0.285, 0.72 ], [ 0.03, 0.68, 0.815, 0.72 ] ] ) {

		const b = box( w, h, 0.022 );
		b.translate( x, y, d.zFace - 0.011 );
		kit.add( 'wood', b, { rough: 0.3 } );

	}

}

// ------------------------------------------------------------------ seating

function buildSeating( kit, L ) {

	const x = HOUSE.helmX, z = HOUSE.seatZ, y0 = L.deckY;
	const baseP = cylinder( 0.18, 0.19, 0.012, 20 );
	baseP.translate( x, y0 + 0.006, z );
	kit.add( 'fittings', baseP, STAINLESS );
	kit.add( 'fittings', rod( V( x, y0, z ), V( x, 0.92, z ), 0.042, 14 ), STAINLESS );
	const ring = torus( 0.17, 0.011, 6, 28 );
	ring.applyMatrix4( mat4( x, 0.62, z, Math.PI / 2, 0, 0 ) );
	kit.add( 'fittings', ring, STAINLESS );
	for ( let i = 0; i < 3; i ++ ) {

		const a = i * Math.PI * 2 / 3 + 0.5;
		kit.add( 'fittings', rod( V( x + Math.cos( a ) * 0.04, 0.62, z + Math.sin( a ) * 0.04 ), V( x + Math.cos( a ) * 0.165, 0.62, z + Math.sin( a ) * 0.165 ), 0.008, 6 ), STAINLESS );

	}

	const pan = roundedBox( 0.44, 0.045, 0.4, 0.015, 1 );
	pan.translate( x, 0.94, z );
	kit.add( 'fittings', pan, { color: 0x2b2e33, rough: 0.5 } );
	const cushion = roundedBox( 0.46, 0.085, 0.42, 0.035, 1 );
	cushion.translate( x, 1.0, z );
	kit.add( 'fittings', cushion, VINYL );
	const back = roundedBox( 0.44, 0.3, 0.075, 0.03, 1 );
	back.applyMatrix4( mat4( x, 1.22, z - 0.2, - 0.17, 0, 0 ) );
	kit.add( 'fittings', back, VINYL );
	kit.add( 'fittings', rod( V( x, 0.96, z - 0.17 ), V( x, 1.12, z - 0.2 ), 0.018, 8 ), STAINLESS );

	// companion bench on the port side
	const bench = roundedBox( 0.42, 0.4, 0.75, 0.02, 1 );
	bench.translate( 0.86, y0 + 0.2, 0.45 );
	kit.add( 'gelcoat', bench, { color: PALETTE.gelcoat, rough: 0.35 } );
	const bc = roundedBox( 0.42, 0.07, 0.73, 0.03, 1 );
	bc.translate( 0.86, y0 + 0.435, 0.45 );
	kit.add( 'fittings', bc, VINYL );

}

// ------------------------------------------------------------------ lived-in detail: sole, headliner, props

// inner face of the wheelhouse side wall (s = 1 port, -1 starboard) and the inward normal
function wallIn( L, s, z, y ) {

	return s * ( wallX( L, z, y ) - HOUSE.wallT );

}