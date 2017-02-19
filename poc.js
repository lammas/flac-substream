'use strict';

const fs = require('fs');
const devnull = require('dev-null');
const seektable = require('flac-seektable');
const Format = require('bin-format');

// TODO: bitwise module, perhaps? https://www.npmjs.com/package/bitwise
// this almost does what i need, but not quite: https://www.npmjs.com/package/bit-buffer

// NOTE: all ints are big-endian unless noted otherwise
// NOTE: https://xiph.org/flac/format.html

function uintToBits(n, numBits) {
	var a = [];
	for (var i=numBits-1; i>=0; i--) {
		a.push((n & (1 << i)) > 0 ? 1 : 0);
	}
	return a;
}

function uintFromBits(bitArray) {
	var n = 0;
	for (var i=0; i<bitArray.length; i++) {
		if (bitArray[i] == 0)
			continue;
		n |= (1 << (bitArray.length - 1 - i));
	}
	return n;
}

function bufferToBits(buffer) {
	var bits = [];
	for (var i = 0; i < buffer.length; ++i) {
		var byte = buffer[i];
		for (var bit = 7; bit >= 0; --bit) {
			bits.push( byte & (1 << bit) ? 1 : 0 );
		}
	}
	return bits;
}

function bitsToBuffer(bits) {
	if (bits.length % 8 != 0)
		throw new Error('bitsToBuffer: bit array must be divisible by 8');

	var buffer = Buffer.alloc(bits.length / 8, 0);
	var idx = 0;
	for (var i=0; i<bits.length; i+=8) {
		var val = uintFromBits(bits.slice(i, i+8));
		buffer[idx++] = val;
	}
	return buffer;
}

class FLACMetaDataBlockHeader {
	constructor(data) {
		this.data = data;
		// <bits>
		// <1> - isLast
		// <7> - BLOCk_TYPE
		// <24> - metadata length

		// this.steps = [];
		// for (var i = 7; i >= 0; i--) {
		// 	this.steps.push( data & (1 << i) ? 1 : 0 );
		// }
	}

	serialize() {
		return this.data;

		// return Utils.uintFromBits(this.steps);
	}
}

var FLACStreamInfo = new Format()
	.uint32BE('header', FLACMetaDataBlockHeader)
	.uint16BE('minblocksize')
	.uint16BE('maxblocksize')
	.buffer('minframesize', 3) // uint24
	.buffer('maxframesize', 3) // uint24
	.buffer('data', 8) // uint64
	.buffer('md5', 16);

var FLAC = new Format()
	.buffer('signature', 4)
	.nest('streaminfo', FLACStreamInfo)
	.buffer('unparsed', 'eof');

function make_header(data) {
}

function test_substream(data, start, end) {
	// console.log(data);
	// console.log(data.seekpoints.length);

	var chunkStart = data.seekpoints[start];
	var chunkEnd = data.seekpoints[end];
	var chunkSamples = chunkEnd.sample - chunkStart.sample;
	console.log('subsection:', chunkStart, chunkEnd);
	console.log('number of samples:', chunkSamples);

	var headerReader = fs.createReadStream(
		'02-Inigo_Kennedy_-_Untitled.flac',
		{
			start: 0,
			end: data.audio_offset
		}
	);

	var buffers = [];
	headerReader.on('data', (chunk) => {
		buffers.push(chunk);
	});

	headerReader.on('end', () => {
		var headerData = Buffer.concat(buffers);
		buffers.length = 0;

		var parsed = FLAC.parse(headerData);
		var bits = bufferToBits(parsed.streaminfo.data);

		// console.log('data bits: ', bits.join(''));
		// var numSamplesBits = bits.slice(-36);
		// var numSamples = uintFromBits(numSamplesBits);
		// console.log('numSamples: ', numSamples);

		// Bits for actual numSamples
		var numSamplesBits = uintToBits(chunkSamples, 36);
		for (var i=0; i<numSamplesBits.length; ++i) {
			bits[bits.length - 36 + i] = numSamplesBits[i];
		}

		parsed.streaminfo.data = bitsToBuffer(bits);
		headerData = FLAC.write(parsed);

		// console.log('HDR:', headerData);
		// console.log('HDR length:', headerData.length);

		var writer = fs.createWriteStream('out.flac', { flags: 'w' });
		writer.write(headerData);

		var sampleData = fs.createReadStream(
			'02-Inigo_Kennedy_-_Untitled.flac',
			{
				start: data.audio_offset + chunkStart.offset,
				end: data.audio_offset + chunkEnd.offset
			}
		);

		sampleData.on('end', () => {
			console.log('done');
			writer.end();
		});

		sampleData.pipe(writer);
	});
}

var reader = fs.createReadStream('02-Inigo_Kennedy_-_Untitled.flac');
reader.pipe(new seektable(function(data) {
	test_substream(data, 60, 70);
})).pipe(devnull());
