

function buildCabinDetail( kit, L ) {

	const d = HOUSE.dash;
	const y0 = L.deckY;
	const yb = HOUSE.roofUnderY;
	const hullIn = ( z ) => Math.min( houseHalfWidth( L, z ) - HOUSE.wallT, L.halfBreadth( L.tAtSheerZ( z ), y0 ) - L.shell ) - 0.015;

	// ---- teak-and-holly sole from the house back to the console (planks fore and aft)
	const soleOut = [];
	const zA = L.houseBack - 0.02, zB = d.zFace - 0.005;
	for ( let i = 0; i <= 6; i ++ ) {

		const z = lerp( zA, zB, i / 6 );
		soleOut.push( [ z, - hullIn( z ) ] );

	}

	for ( let i = 6; i >= 0; i -- ) {

		const z = lerp( zA, zB, i / 6 );
		soleOut.push( [ z, hullIn( z ) ] );

	}

	const sole = slab( soleOut, [], ( u, v, side ) => V( v, y0 + 0.009 - side * 0.009, u ), { back: false } );
	kit.add( 'wood', sole, { rough: 0.5, pattern: 2 } );

	// ---- headliner battens (varnished) across the roof, and a teak grab rail overhead
	for ( const z of [ - 0.22, 0.26, 0.74 ] ) {

		const w = 2 * ( wallX( L, z, yb ) - HOUSE.wallT ) - 0.02;
		const b = box( 0.045, 0.016, w );
		b.applyMatrix4( mat4( 0, yb - 0.008, z, 0, Math.PI / 2, 0 ) );
		kit.add( 'wood', b, { rough: 0.35 } );

	}

	const gy = yb - 0.06;
	kit.add( 'wood', rod( V( - 0.32, gy, - 0.2 ), V( - 0.32, gy, 0.9 ), 0.016, 10 ), { rough: 0.35 } );
	for ( const z of [ - 0.12, 0.35, 0.82 ] ) kit.add( 'fittings', rod( V( - 0.32, gy, z ), V( - 0.32, yb - 0.004, z ), 0.011, 8 ), STAINLESS );

	// ---- overhead rod rack on the port side: three rods with cork grips and reels
	for ( const z of [ - 0.3, 0.35, 0.95 ] ) {

		const br = box( 0.36, 0.012, 0.03 );
		br.translate( 0.64, yb - 0.08, z );
		kit.add( 'fittings', br, BLACK_PLASTIC );
		for ( const x of [ 0.48, 0.8 ] ) kit.add( 'fittings', rod( V( x, yb - 0.08, z ), V( x, yb - 0.002, z ), 0.005, 6 ), STAINLESS );

	}

	for ( const [ i, x ] of [ 0.54, 0.64, 0.74 ].entries() ) {

		const y = yb - 0.066;
		const z0 = - 0.42 + i * 0.05, z1 = 1.12;
		kit.add( 'fittings', rod( V( x, y, z0 ), V( x, y, z1 ), 0.007, 6, 0.0025 ), { color: [ 0x1b1c1e, 0x2a3a52, 0x4a1f1a ][ i ], rough: 0.3 } );
		kit.add( 'fittings', rod( V( x, y, z0 ), V( x, y, z0 + 0.24 ), 0.013, 8 ), { color: 0xb48a5c, rough: 0.85 } );
		const reel = cylinder( 0.034, 0.034, 0.03, 12 );
		reel.applyMatrix4( mat4( x, y - 0.045, z0 + 0.3, 0, 0, Math.PI / 2 ) );
		kit.add( 'fittings', reel, { color: [ 0x8a8d91, 0xb89040, 0x2b2d30 ][ i ], rough: 0.3, metal: 1 } );
		kit.add( 'fittings', rod( V( x, y - 0.012, z0 + 0.3 ), V( x, y - 0.03, z0 + 0.3 ), 0.004, 5 ), { color: 0x2b2d30, rough: 0.4 } );

	}

	// ---- port wall: breaker panel below the forward window, oilskin and lifejacket on hooks aft
	{

		const z = 0.56, y = 1.33, x = wallIn( L, 1, z, y );
		const pnl = box( 0.014, 0.22, 0.34 );
		pnl.translate( x - 0.007, y, z );
		kit.add( 'fittings', pnl, { color: 0x3a3d42, rough: 0.5, pattern: 4 } );
		for ( let r = 0; r < 2; r ++ ) {

			const ry = y + 0.045 - r * 0.1;
			const lt = box( 0.002, 0.014, 0.3 );
			lt.translate( x - 0.015, ry + 0.035, z );
			kit.add( 'fittings', lt, { color: 0xffffff, rough: 0.5, pattern: 8 } );
			for ( let k = 0; k < 8; k ++ ) {

				const bk = box( 0.016, 0.034, 0.02 );
				bk.translate( x - 0.021, ry, z - 0.135 + k * 0.0386 );
				kit.add( 'fittings', bk, { color: 0x121314, rough: 0.4 } );
				const tog = box( 0.012, 0.012, 0.008 );
				tog.translate( x - 0.034, ry + ( ( k * 7 + r * 3 ) % 5 === 0 ? - 0.007 : 0.007 ), z - 0.135 + k * 0.0386 );
				kit.add( 'fittings', tog, { color: ( k * 7 + r * 3 ) % 5 === 0 ? 0xb02a22 : 0x1e1f21, rough: 0.4 } );

			}

		}

	}

	const hang = ( z, yTop, color, scale ) => {

		const x = wallIn( L, 1, z, yTop );
		kit.add( 'fittings', rod( V( x, yTop + 0.02, z ), V( x - 0.05, yTop + 0.04, z ), 0.006, 6 ), STAINLESS );
		// garment hanging by its collar: narrow at the hook, sloping shoulders, a slightly flared hem
		// with an open bottom, pressed flat against the wall; sleeves hang down the front
		const prof = [ [ 0.17, 0.0 ], [ 0.2, 0.03 ], [ 0.2, 0.3 ], [ 0.21, 0.5 ], [ 0.2, 0.56 ], [ 0.12, 0.62 ], [ 0.05, 0.66 ], [ 0.001, 0.665 ] ];
		const g = lathe( prof.map( ( [ r, h ] ) => [ r * scale, h * scale ] ), 20 );
		g.applyMatrix4( mat4( x - 0.06, yTop - 0.66 * scale, z, 0, 0, 0, 0.3, 1, 1 ) );
		kit.add( 'fittings', g, { color, rough: 0.6, pattern: 9 } );
		for ( const sd of [ - 1, 1 ] ) {

			const sh = V( x - 0.07, yTop - 0.12 * scale, z + sd * 0.17 * scale );
			const sleeve = tube( [ sh, V( x - 0.1, yTop - 0.3 * scale, z + sd * 0.2 * scale ), V( x - 0.11, yTop - 0.52 * scale, z + sd * 0.16 * scale ) ], 0.045 * scale, 10, 8 );
			kit.add( 'fittings', sleeve, { color, rough: 0.6, pattern: 9 } );

		}

		const hood = sphere( 0.1 * scale, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.6 );
		hood.applyMatrix4( mat4( x - 0.04, yTop - 0.03, z, 0.5, 0, 0, 0.5, 0.8, 1 ) );
		kit.add( 'fittings', hood, { color: new Color( color ).multiplyScalar( 0.85 ).getHex(), rough: 0.6, pattern: 9 } );
	};

	hang( - 0.12, 1.92, 0xe0a81c, 1.0 ); // yellow oilskin
	hang( 0.14, 1.9, 0xe2531a, 0.8 ); // orange lifejacket

	// ---- starboard wall: extinguisher on its bracket, photos and the tide table, torch in a clip
	{

		const z = - 0.18, yb0 = y0 + 0.2, x = wallIn( L, - 1, z, 0.8 );
		const ex = x + 0.075;
		const body = lathe( [ [ 0, 0 ], [ 0.058, 0.0 ], [ 0.062, 0.02 ], [ 0.062, 0.3 ], [ 0.05, 0.35 ], [ 0.018, 0.37 ], [ 0, 0.37 ] ], 18 );
		body.translate( ex, yb0, z );
		kit.add( 'fittings', body, { color: 0xb3150f, rough: 0.35 } );
		const valve = box( 0.03, 0.05, 0.05 );
		valve.translate( ex, yb0 + 0.39, z );
		kit.add( 'fittings', valve, { color: 0x1a1a1a, rough: 0.4 } );
		kit.add( 'fittings', rod( V( ex, yb0 + 0.41, z ), V( ex + 0.02, yb0 + 0.42, z + 0.09 ), 0.007, 6 ), { color: 0x8c8f93, rough: 0.3, metal: 1 } );
		kit.add( 'fittings', tube( [ V( ex, yb0 + 0.38, z + 0.02 ), V( ex + 0.03, yb0 + 0.3, z + 0.07 ), V( ex + 0.05, yb0 + 0.15, z + 0.06 ), V( ex + 0.06, yb0 + 0.08, z + 0.03 ) ], 0.008, 12, 5 ), { color: 0x141414, rough: 0.6 } );
		for ( const h of [ 0.12, 0.26 ] ) {

			const strap = torus( 0.064, 0.004, 4, 20 );
			strap.applyMatrix4( mat4( ex, yb0 + h, z, Math.PI / 2, 0, 0 ) );
			kit.add( 'fittings', strap, STAINLESS );

		}

		const plate = box( 0.006, 0.3, 0.07 );
		plate.translate( x + 0.003, yb0 + 0.19, z );
		kit.add( 'fittings', plate, STAINLESS );
		// instruction label on the cylinder
		const lab = cylinder( 0.0625, 0.0625, 0.1, 18, 1, true, - 0.9, 1.8 );
		lab.translate( ex, yb0 + 0.19, z );
		kit.add( 'fittings', lab, { color: 0xffffff, rough: 0.5, pattern: 8 } );

	}

	const onWall = ( s, z, y, w, h, roll, opts ) => {

		const q = new PlaneGeometry( w, h );
		q.applyMatrix4( mat4( 0, 0, 0, 0, s > 0 ? - Math.PI / 2 : Math.PI / 2, 0 ) );
		q.applyMatrix4( new Matrix4().makeRotationX( roll ) );
		q.translate( 0, y, z );
		// follow the wall (it curves with the hull and leans in above the rail): each vertex sits
		// 12 mm off the analytic inner face (the wall mesh is faceted: its chords stand ~1 cm proud of
		// the curve), so no part of the card can dip behind it
		const pos = q.getAttribute( 'position' );
		for ( let i = 0; i < pos.count; i ++ ) pos.setX( i, wallIn( L, s, pos.getZ( i ), pos.getY( i ) ) - s * 0.012 );
		pos.needsUpdate = true;
		q.computeVertexNormals();
		kit.add( 'fittings', q, opts );

	};

	onWall( - 1, 0.02, 1.47, 0.1, 0.13, 0.06, { color: 0xffffff, rough: 0.3, pattern: 7, anim: 0.15 } );
	onWall( - 1, 0.15, 1.42, 0.12, 0.09, - 0.1, { color: 0xffffff, rough: 0.3, pattern: 7, anim: 0.7 } );
	onWall( - 1, 0.36, 1.36, 0.19, 0.25, 0.02, { color: 0xffffff, rough: 0.9, pattern: 5 } );
	// masking tape holding the tide table
	for ( const [ dz, dy ] of [ [ - 0.09, 0.12 ], [ 0.09, 0.12 ] ] ) onWall( - 1, 0.36 + dz, 1.36 + dy, 0.05, 0.018, 0.5, { color: 0xd8cfa8, rough: 0.8 } );

	{

		// torch in its clip, forward on the starboard wall
		const z = 0.85, y = 1.3, x = wallIn( L, - 1, z, y ) + 0.035;
		kit.add( 'fittings', rod( V( x, y, z - 0.1 ), V( x, y, z + 0.1 ), 0.02, 12 ), { color: 0xf2c21b, rough: 0.45 } );
		kit.add( 'fittings', rod( V( x, y, z + 0.1 ), V( x, y, z + 0.13 ), 0.026, 12 ), { color: 0x1a1a1a, rough: 0.4 } );
		for ( const dz of [ - 0.06, 0.05 ] ) {

			const clip = torus( 0.023, 0.003, 4, 12, Math.PI * 1.3 );
			clip.applyMatrix4( mat4( x, y, z + dz, 0, Math.PI / 2, - 0.65 ) );
			kit.add( 'fittings', clip, BLACK_PLASTIC );

		}

	}

	// ---- dash top: clipboard with the fishing log, mug of coffee in a holder
	{

		const ytop = d.yTop + 0.01;
		const m = mat4( 0.74, ytop + 0.004, 1.26, 0, 0.18, 0 );
		const board = box( 0.23, 0.005, 0.31 );
		board.applyMatrix4( m );
		kit.add( 'fittings', board, { color: 0x6b4a2b, rough: 0.7 } );
		const paper = new PlaneGeometry( 0.21, 0.28 );
		paper.applyMatrix4( mat4( 0, 0.0035, 0.012, - Math.PI / 2, 0, 0 ) );
		paper.applyMatrix4( m );
		kit.add( 'fittings', paper, { color: 0xffffff, rough: 0.9, pattern: 5 } );
		const clip = box( 0.08, 0.014, 0.03 );
		clip.applyMatrix4( mat4( 0, 0.008, 0.14 ) );
		clip.applyMatrix4( m );
		kit.add( 'fittings', clip, STAINLESS );

		const mx = - 0.76, mz = 1.34;
		const holder = torus( 0.05, 0.006, 6, 18 );
		holder.applyMatrix4( mat4( mx, ytop + 0.035, mz, Math.PI / 2, 0, 0 ) );
		kit.add( 'fittings', holder, BLACK_PLASTIC );
		const mug = cylinder( 0.042, 0.038, 0.095, 18, 1, true );
		mug.translate( mx, ytop + 0.048, mz );
		kit.add( 'fittings', mug, { color: 0x1f4a3a, rough: 0.25 } );
		const inner = cylinder( 0.039, 0.036, 0.09, 18, 1, true );
		inner.translate( mx, ytop + 0.05, mz );
		orientTowardsAxis( inner );
		kit.add( 'fittings', inner, { color: 0xe9e4d8, rough: 0.25 } );
		const coffee = new CircleGeometry( 0.039, 18 );
		coffee.applyMatrix4( mat4( mx, ytop + 0.082, mz, - Math.PI / 2, 0, 0 ) );
		kit.add( 'fittings', coffee, { color: 0x2a160b, rough: 0.1 } );
		const base = new CircleGeometry( 0.038, 18 );
		base.applyMatrix4( mat4( mx, ytop + 0.0005, mz, Math.PI / 2, 0, 0 ) );
		kit.add( 'fittings', base, { color: 0x1f4a3a, rough: 0.4 } );
		const handle = torus( 0.026, 0.006, 6, 12, Math.PI );
		handle.applyMatrix4( mat4( mx - 0.042, ytop + 0.048, mz, 0, 0, Math.PI / 2 ) );
		kit.add( 'fittings', handle, { color: 0x1f4a3a, rough: 0.25 } );

	}

	// ---- port bench: lifejackets, a folded chart; coiled line on the sole aft
	{

		const top = y0 + 0.47;
		for ( const [ i, dy ] of [ 0, 0.05 ].entries() ) {

			const v = roundedBox( 0.34, 0.05, 0.4, 0.02, 1 );
			v.applyMatrix4( mat4( 0.86, top + 0.025 + dy, 0.28 + i * 0.02, 0, 0.12 * i - 0.05, 0 ) );
			kit.add( 'fittings', v, { color: 0xe2531a, rough: 0.6, pattern: 9 } );
			for ( const dz of [ - 0.08, 0.08 ] ) {

				const st = box( 0.345, 0.052, 0.025 );
				st.applyMatrix4( mat4( 0.86, top + 0.025 + dy, 0.28 + i * 0.02 + dz, 0, 0.12 * i - 0.05, 0 ) );
				kit.add( 'fittings', st, { color: 0x151515, rough: 0.7 } );

			}

		}

		const chart = new PlaneGeometry( 0.3, 0.22 );
		chart.applyMatrix4( mat4( 0.85, top + 0.002, 0.64, - Math.PI / 2, 0, 0.3 ) );
		kit.add( 'fittings', chart, { color: 0xffffff, rough: 0.85, pattern: 6 } );

		for ( let k = 0; k < 5; k ++ ) {

			const loop = torus( 0.15 - k * 0.004, 0.011, 6, 28 );
			loop.applyMatrix4( mat4( 0.62 + k * 0.004, y0 + 0.02 + k * 0.02, - 0.14 + k * 0.006, Math.PI / 2 + ( k % 2 ) * 0.06, 0, 0 ) );
			const uv = loop.attributes.uv;
			for ( let j = 0; j < uv.count; j ++ ) uv.setXY( j, uv.getX( j ) * 0.94, uv.getY( j ) );
			kit.add( 'fittings', loop, { color: 0x2c5a8c, rough: 0.8, pattern: 1 } );

		}

	}

}

// flip a lathe / open cylinder's winding so its faces point inward (the inside of the mug)
function orientTowardsAxis( g ) {

	const idx = Array.from( g.index.array );
	for ( let i = 0; i < idx.length; i += 3 ) {

		const t = idx[ i + 1 ]; idx[ i + 1 ] = idx[ i + 2 ]; idx[ i + 2 ] = t;

	}

	g.setIndex( idx );
	const n = g.attributes.normal;
	for ( let i = 0; i < n.count; i ++ ) n.setXYZ( i, - n.getX( i ), - n.getY( i ), - n.getZ( i ) );

}

// ------------------------------------------------------------------ roof gear: mast, radars, lights, antennas

function buildRoofGear( kit, L, parts ) {

	const yr = roofTopY( 0 );
	const mz = - 0.5;

	// mast
	const mb = box( 0.18, 0.025, 0.18 );
	mb.translate( 0, yr + 0.005, mz );
	kit.add( 'fittings', mb, WHITE_PAINT );
	kit.add( 'fittings', rod( V( 0, yr, mz ), V( 0, 3.9, mz ), 0.042, 14, 0.03 ), WHITE_PAINT );

	// radome on a forward bracket
	const ry = 3.02;
	const arm = box( 0.1, 0.035, 0.34 );
	arm.translate( 0, ry - 0.02, mz + 0.19 );
	kit.add( 'fittings', arm, WHITE_PAINT );
	const plate = box( 0.34, 0.015, 0.34 );
	plate.translate( 0, ry, mz + 0.3 );
	kit.add( 'fittings', plate, WHITE_PAINT );
	kit.add( 'fittings', rod( V( 0, ry - 0.02, mz + 0.04 ), V( 0, ry - 0.2, mz + 0.01 ), 0.012, 6 ), WHITE_PAINT );
	const radome = lathe( [ [ 0, 0 ], [ 0.285, 0 ], [ 0.3, 0.018 ], [ 0.3, 0.095 ], [ 0.29, 0.14 ], [ 0.245, 0.188 ], [ 0.16, 0.222 ], [ 0.07, 0.234 ], [ 0, 0.236 ] ], 24 );
	radome.translate( 0, ry + 0.008, mz + 0.3 );
	kit.add( 'fittings', radome, { color: 0xf3f2ee, rough: 0.4 } );
	const band = cylinder( 0.302, 0.302, 0.02, 24, 1, true );
	band.translate( 0, ry + 0.03, mz + 0.3 );
	kit.add( 'fittings', band, { color: 0x3a3d42, rough: 0.5 } );

	// spreader with side lights, masthead light
	const sy = 3.45;
	const spreader = box( 0.78, 0.03, 0.045 );
	spreader.translate( 0, sy - 0.05, mz );
	kit.add( 'fittings', spreader, WHITE_PAINT );
	for ( const s of [ 1, - 1 ] ) {

		const hx = s * 0.4;
		const housing = box( 0.055, 0.07, 0.11 );
		housing.translate( hx, sy, mz + 0.02 );
		kit.add( 'fittings', housing, BLACK_PLASTIC );
		const lens = box( 0.014, 0.05, 0.085 );
		lens.translate( hx + s * 0.033, sy, mz + 0.03 );
		kit.add( 'glow', lens, { color: s > 0 ? 0xff1a0e : 0x14ff5a, rough: 0.2, pattern: 0 } );
		// inboard screen
		const scr = box( 0.004, 0.07, 0.12 );
		scr.translate( hx - s * 0.03, sy, mz + 0.02 );
		kit.add( 'fittings', scr, BLACK_PLASTIC );

	}

	const mhBase = cylinder( 0.036, 0.036, 0.03, 12 );
	mhBase.translate( 0, 3.915, mz );
	kit.add( 'fittings', mhBase, BLACK_PLASTIC );
	const mhLens = cylinder( 0.03, 0.03, 0.065, 12 );
	mhLens.translate( 0, 3.962, mz );
	kit.add( 'glow', mhLens, { color: 0xfff3dc, rough: 0.2, pattern: 0 } );
	const mhCap = cylinder( 0.034, 0.038, 0.016, 12 );
	mhCap.translate( 0, 4.003, mz );
	kit.add( 'fittings', mhCap, BLACK_PLASTIC );

	// VHF whips on ratchet mounts at the aft roof corners (sway in the vertex shader)
	for ( const s of [ 1, - 1 ] ) {

		const x = s * 1.02, z = - 0.78, y = roofTopY( 1.02 );
		const mount = roundedBox( 0.06, 0.07, 0.06, 0.01, 1 );
		mount.translate( x, y + 0.035, z );
		kit.add( 'fittings', mount, STAINLESS );
		const len = s > 0 ? 2.4 : 1.2;
		const whip = cylinder( 0.005, 0.013, len, 8, 10 );
		whip.translate( x, y + 0.07 + len / 2, z );
		auxVertices( whip, ( p ) => [ 0.3, 0, 3, Math.max( 0, ( p.y - y - 0.07 ) / len ) ] );
		kit.add( 'fittings', whip, { color: 0xf4f4f1 } );

	}

	// open-array radar pedestal (array is animated, built in BoatModel)
	const pz = 0.8;
	const ped = roundedBox( 0.26, 0.28, 0.3, 0.03, 1 );
	ped.translate( 0, yr + 0.14, pz );
	kit.add( 'fittings', ped, { color: 0xf3f2ee, rough: 0.4 } );
	parts.radarPivot = V( 0, yr + 0.3, pz );

	// spotlight and horn on the front of the roof
	const sx = 0.42, szz = 1.05, syy = roofTopY( 0.42 );
	kit.add( 'fittings', rod( V( sx, syy, szz ), V( sx, syy + 0.1, szz ), 0.03, 10 ), BLACK_PLASTIC );
	const head = cylinder( 0.065, 0.06, 0.15, 16 );
	head.applyMatrix4( mat4( sx, syy + 0.17, szz, Math.PI / 2, 0, 0 ) );
	kit.add( 'fittings', head, STAINLESS );
	const sl = new CircleGeometry( 0.058, 16 );
	sl.translate( sx, syy + 0.17, szz + 0.0755 );
	kit.add( 'glow', sl, { color: 0xfff1d6, rough: 0.2, pattern: 4 } );
	const horn = lathe( [ [ 0.0, 0 ], [ 0.018, 0.0 ], [ 0.016, 0.1 ], [ 0.024, 0.17 ], [ 0.05, 0.22 ], [ 0.046, 0.222 ], [ 0.0, 0.2 ] ], 16 );
	horn.applyMatrix4( mat4( - sx, roofTopY( 0.42 ) + 0.07, szz - 0.12, Math.PI / 2, 0, 0 ) );
	kit.add( 'fittings', horn, STAINLESS );
	kit.add( 'fittings', rod( V( - sx, roofTopY( 0.42 ), szz ), V( - sx, roofTopY( 0.42 ) + 0.07, szz ), 0.012, 6 ), STAINLESS );

	// the owner's buoy colours displayed on the roof
	const bx = 0.62, bz = - 0.72;
	const bracket = box( 0.12, 0.03, 0.12 );
	bracket.translate( bx, roofTopY( bx ) + 0.015, bz );
	kit.add( 'fittings', bracket, STAINLESS );
	for ( const [ g, opts ] of buoyGeometry() ) {

		g.translate( bx, roofTopY( bx ) + 0.03, bz );
		kit.add( 'fittings', g, opts );

	}

	// deck floodlights under the roof overhang, aimed at the work deck
	for ( const s of [ 1, - 1 ] ) {

		const fl = roundedBox( 0.13, 0.07, 0.08, 0.01, 1 );
		fl.translate( s * 0.55, HOUSE.roofUnderY - 0.035, HOUSE.roofZ0 + 0.14 );
		kit.add( 'fittings', fl, BLACK_PLASTIC );
		const lens = new PlaneGeometry( 0.11, 0.06 );
		lens.applyMatrix4( mat4( s * 0.55, HOUSE.roofUnderY - 0.071, HOUSE.roofZ0 + 0.14, Math.PI / 2 + 0.35, 0, 0 ) );
		kit.add( 'glow', lens, { color: 0xfff1d6, rough: 0.2, pattern: 4 } );

	}

	// life ring on the port house side
	const lx = wallX( L, - 0.02, 1.72 ) + 0.05;
	const ringG = torus( 0.235, 0.05, 8, 24 );
	ringG.applyMatrix4( mat4( lx, 1.72, - 0.02, 0, Math.PI / 2, 0 ) );
	paintVertices( ringG, ( p ) => {

		const a = Math.atan2( p.y - 1.72, p.z + 0.02 );
		return Math.abs( ( ( a / ( Math.PI / 2 ) ) % 1 + 1 ) % 1 - 0.5 ) > 0.4 ? 0xf2f0ea : 0xf25a12;

	} );
	kit.add( 'fittings', ringG, { rough: 0.6 } );
	const hook = box( 0.03, 0.05, 0.08 );
	hook.translate( lx - 0.03, 1.72 + 0.26, - 0.02 );
	kit.add( 'fittings', hook, STAINLESS );

	void parts;

}

// Steering wheel: varnished mahogany destroyer wheel with a brass hub.
// Local frame: +Z is the shaft axis (into the dash), spokes in the XY plane.
function wheelGeometry() {

	const list = [];
	const wood = { rough: 0.3, metal: 0 };
	const R = 0.2;
	list.push( prepare( torus( R, 0.017, 8, 40 ), { ...wood, color: 0xe8b898 } ) );
	for ( let i = 0; i < 6; i ++ ) {

		const a = i * Math.PI / 3 + Math.PI / 6; // king spoke straight up when centred
		const dir = V( Math.cos( a ), Math.sin( a ), 0 );
		const spoke = cylinder( 0.009, 0.013, R - 0.05, 8 );
		spoke.applyMatrix4( alignY( dir.clone().multiplyScalar( 0.05 + ( R - 0.05 ) / 2 ), dir ) );
		list.push( prepare( spoke, { ...wood, color: 0xe8b898 } ) );
		const handle = lathe( [ [ 0.0, 0 ], [ 0.011, 0.0 ], [ 0.013, 0.02 ], [ 0.017, 0.045 ], [ 0.012, 0.06 ], [ 0.01, 0.07 ], [ 0.015, 0.078 ], [ 0.0, 0.086 ] ], 8 );
		handle.applyMatrix4( alignY( dir.clone().multiplyScalar( R - 0.005 ), dir ) );
		list.push( prepare( handle, { ...wood, color: 0xe8b898 } ) );

	}

	const hub = lathe( [ [ 0, - 0.03 ], [ 0.05, - 0.03 ], [ 0.058, - 0.012 ], [ 0.058, 0.012 ], [ 0.05, 0.028 ], [ 0.0, 0.03 ] ], 20 );
	hub.applyMatrix4( new Matrix4().makeRotationX( Math.PI / 2 ) );
	list.push( prepare( hub, { ...wood, color: 0xe8b898 } ) );
	const cap = sphere( 0.032, 16, 6, 0, Math.PI * 2, 0, Math.PI / 2 );
	cap.applyMatrix4( new Matrix4().makeRotationX( - Math.PI / 2 ) );
	cap.translate( 0, 0, - 0.028 );
	list.push( prepare( cap, { color: 0xc8a050, rough: 0.25, metal: 1, pattern: 1 } ) );
	return mergePrepared( list );

}

// Throttle lever, local origin at the pivot, lever pointing +Y (neutral).
function throttleGeometry() {

	const list = [];
	list.push( prepare( rod( V( 0, - 0.01, 0 ), V( 0, 0.15, 0.015 ), 0.008, 8 ), STAINLESS ) );
	const knob = sphere( 0.022, 14, 10 );
	knob.scale( 1, 1.15, 1 );
	knob.translate( 0, 0.165, 0.016 );
	list.push( prepare( knob, BLACK_PLASTIC ) );
	const boss = cylinder( 0.02, 0.02, 0.05, 12 );
	boss.applyMatrix4( new Matrix4().makeRotationZ( Math.PI / 2 ) );
	list.push( prepare( boss, STAINLESS ) );
	return mergePrepared( list );

}

// Open-array radar antenna, local origin on the rotation axis at the pedestal top.
function radarArrayGeometry() {

	const list = [];
	list.push( prepare( cylinder( 0.05, 0.06, 0.06, 14 ), { color: 0xf3f2ee, rough: 0.4 } ) );
	const bar = roundedBox( 1.05, 0.12, 0.1, 0.035, 2 );
	bar.translate( 0, 0.09, 0 );
	list.push( prepare( bar, { color: 0xf3f2ee, rough: 0.4 } ) );
	const stripe = box( 0.95, 0.028, 0.004 );
	stripe.translate( 0, 0.09, 0.051 );
	list.push( prepare( stripe, { color: 0x2c2f35, rough: 0.5 } ) );
	return mergePrepared( list );

}

return {HOUSE,wsZ,wallX,roofTopY,buildWheelhouse,panelFrame,wheelGeometry,throttleGeometry,radarArrayGeometry};
})();
NS.Running=(()=>{
const {Matrix4, Vector3} = ENG;
const {lathe, fanCap, gridSurface, orientTowards, prepare, mergePrepared, cylinder} = NS.GeoKit;
const {PALETTE} = NS.HullBuilder;

const V = ( x, y, z ) => new Vector3( x, y, z );

// Propeller hub centre (boat frame) and rudder stock pivot.
const PROP = { position: V( 0, - 0.53, - 3.3 ), radius: 0.21, blades: 4, pitch: 0.42 };
const RUDDER = { pivot: V( 0, - 0.52, - 3.58 ), top: - 0.33, bottom: - 0.72, lead: 0.08, trail: - 0.27, maxAngle: 0.61 };

const BRONZE = { color: 0xc8905a, rough: 0.3, metal: 1 };

// Four-blade right-handed propeller. Local frame: shaft axis +Z (forward); a positive
// rotation about +Z (clockwise seen from astern) drives the boat ahead.
function propellerGeometry() {

	const { radius: R, blades, pitch: P } = PROP;
	const list = [];

	const hub = lathe( [ [ 0, - 0.09 ], [ 0.015, - 0.085 ], [ 0.03, - 0.068 ], [ 0.043, - 0.04 ], [ 0.048, 0.0 ], [ 0.047, 0.04 ], [ 0.042, 0.06 ], [ 0, 0.06 ] ], 18 );
	hub.applyMatrix4( new Matrix4().makeRotationX( Math.PI / 2 ) );
	list.push( prepare( hub, BRONZE ) );

	const rh = 0.042;
	const NR = 9, NC = 9;
	for ( let b = 0; b < blades; b ++ ) {

		const theta0 = b * Math.PI * 2 / blades;
		const mid = [];
		for ( let i = 0; i < NR; i ++ ) {

			const rho = i / ( NR - 1 );
			const r = rh + ( R - rh ) * rho;
			const chord = 0.15 * Math.sqrt( Math.max( 0, 1 - Math.pow( rho, 2.4 ) ) ) * ( 0.62 + 0.38 * Math.sin( Math.PI * Math.min( 1, rho * 1.4 ) ) ) + 0.002;
			const phi = Math.atan2( P, 2 * Math.PI * r );
			const skew = 0.32 * rho * rho;
			const row = [];
			for ( let k = 0; k < NC; k ++ ) {

				const c = - 1 + 2 * k / ( NC - 1 );
				const s = c * chord * 0.5;
				const th = theta0 - skew + s * Math.cos( phi ) / r;
				row.push( V( Math.cos( th ) * r, Math.sin( th ) * r, s * Math.sin( phi ) ) );

			}

			mid.push( row );

		}

		// thickness along the local surface normal, vanishing at the edges and tip
		const face = [], back = [];
		for ( let i = 0; i < NR; i ++ ) {

			const rho = i / ( NR - 1 );
			const fr = [], br = [];
			for ( let k = 0; k < NC; k ++ ) {

				const c = - 1 + 2 * k / ( NC - 1 );
				const du = mid[ Math.min( NR - 1, i + 1 ) ][ k ].clone().sub( mid[ Math.max( 0, i - 1 ) ][ k ] );
				const dv = mid[ i ][ Math.min( NC - 1, k + 1 ) ].clone().sub( mid[ i ][ Math.max( 0, k - 1 ) ] );
				const n = du.cross( dv ).normalize();
				const t = 0.013 * ( 1 - 0.8 * rho ) * Math.sqrt( Math.max( 0, 1 - c * c ) ) * ( 1 - Math.pow( rho, 8 ) );
				fr.push( mid[ i ][ k ].clone().addScaledVector( n, t * 0.5 ) );
				br.push( mid[ i ][ k ].clone().addScaledVector( n, - t * 0.5 ) );

			}

			face.push( fr ); back.push( br );

		}

		const gf = gridSurface( face );
		const gb = gridSurface( back, { flip: true } );
		// make sure each side faces away from the other
		const probe = face[ 4 ][ 4 ].clone().sub( back[ 4 ][ 4 ] );
		orientTowards( gf, probe );
		orientTowards( gb, probe.clone().negate() );
		gf.computeVertexNormals();
		gb.computeVertexNormals();
		list.push( prepare( gf, BRONZE ), prepare( gb, BRONZE ) );

	}

	return mergePrepared( list );

}

// Balanced spade rudder on a stock; local origin on the stock axis at mid blade.
function rudderGeometry() {

	const { pivot, top, bottom, lead, trail } = RUDDER;
	const yTop = top - pivot.y, yBot = bottom - pivot.y;
	const foil = ( chordScale, y ) => {

		const c = ( lead - trail ) * chordScale;
		const z0 = lead * chordScale;
		const pts = [];
		const N = 12;
		for ( let i = 0; i <= N; i ++ ) {

			const x = 1 - Math.cos( Math.PI * i / N ) * 0.5 - 0.5; // cosine spacing 0..1
			const yt = 5 * 0.14 * ( 0.2969 * Math.sqrt( x ) - 0.126 * x - 0.3516 * x * x + 0.2843 * x ** 3 - 0.1036 * x ** 4 );
			pts.push( [ z0 - x * c, yt * c ] );

		}

		const loop = [];
		for ( let i = 0; i <= N; i ++ ) loop.push( V( pts[ i ][ 1 ], y, pts[ i ][ 0 ] ) );
		for ( let i = N - 1; i >= 1; i -- ) loop.push( V( - pts[ i ][ 1 ], y, pts[ i ][ 0 ] ) );
		return loop;

	};

	const bottomLoop = foil( 0.92, yBot ), topLoop = foil( 1.0, yTop );
	const rows = [ bottomLoop.concat( [ bottomLoop[ 0 ].clone() ] ), topLoop.concat( [ topLoop[ 0 ].clone() ] ) ];
	const side = gridSurface( rows );
	// normals must point away from the stock axis
	const p = side.attributes.position, n = side.attributes.normal;
	let dot = 0;
	const a = V( 0, 0, 0 ), b = V( 0, 0, 0 );
	for ( let i = 0; i < p.count; i ++ ) {

		a.fromBufferAttribute( p, i ); b.fromBufferAttribute( n, i );
		dot += b.x * a.x;

	}

	if ( dot < 0 ) {

		const idx = Array.from( side.index.array );
		for ( let i = 0; i < idx.length; i += 3 ) {

			const t = idx[ i + 1 ]; idx[ i + 1 ] = idx[ i + 2 ]; idx[ i + 2 ] = t;

		}

		side.setIndex( idx );
		side.computeVertexNormals();

	}

	const opts = { color: PALETTE.antifouling, rough: 0.75 };
	const list = [ prepare( side, opts ), prepare( fanCap( bottomLoop, V( 0, - 1, 0 ) ), opts ), prepare( fanCap( topLoop, V( 0, 1, 0 ) ), opts ) ];
	const stock = cylinder( 0.022, 0.022, 0.3, 10 );
	stock.translate( 0, yTop + 0.15, 0 );
	list.push( prepare( stock, BRONZE ) );
	const heel = cylinder( 0.012, 0.012, 0.05, 8 );
	heel.translate( 0, yBot - 0.015, 0 );
	list.push( prepare( heel, BRONZE ) );
	return mergePrepared( list );

}

return {PROP,RUDDER,propellerGeometry,rudderGeometry};
})();