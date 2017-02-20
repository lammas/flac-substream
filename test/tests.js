'use strict';

const test = require('tape');

const bitutils = require('../src/bitutils');

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
