'use strict';

const test = require('tape');
const fs = require('fs');
const devnull = require('dev-null');
const seektable = require('flac-seektable');

const bitutils = require('../src/bitutils');
const substream = require('../index');

test('bitutils: uintToBits / uintFromBits', function(t) {
	const value = 123;
	const numBits = 8;

	var bits = bitutils.uintToBits(value, numBits);
	t.deepEquals(bits, [ 0, 1, 1, 1, 1, 0, 1, 1 ], 'Bits OK');
	var reverse = bitutils.uintFromBits(bits);
	t.equals(reverse, value, 'Reverse conversion OK');
	t.end();
});

test('bitutils: bufferToBits / bitsToBuffer', function(t) {
	const src = Buffer.alloc(4, 'deadbeef', 'hex');

	var bits = bitutils.bufferToBits(src);
	t.equals(bits.length, 4 * 8, 'Correct number of bits');
	var reverse = bitutils.bitsToBuffer(bits);
	t.deepEquals(reverse, src, 'Reverse conversion OK');
	t.end();
});

test('Plain file random access', function(t) {
	const FLAC_IN = 'test/nyanya.flac';
	const FLAC_OUT = 'test/out.flac';
	const START_SECONDS = 2;
	const END_SECONDS = 4;

	t.plan(2);

	var reader = fs.createReadStream(FLAC_IN);
	reader.pipe(new seektable(function(data) {
		t.ok(data, 'Got seek data');
		var output = fs.createWriteStream(FLAC_OUT, { flags: 'w' });
		output.on('finish', () => {
			t.pass('Write stream finished');
			t.end();
		});

		substream(output, data, START_SECONDS, END_SECONDS, function(start, end) {
			var stream = fs.createReadStream(
				FLAC_IN,
				{
					start: start,
					end: end
				}
			);
			return stream;
		});
	})).pipe(devnull());
});
