'use strict';

const fs = require('fs');
const devnull = require('dev-null');
const seektable = require('flac-seektable');
const Format = require('bin-format');

const substream = require('./index');

var reader = fs.createReadStream('02-Inigo_Kennedy_-_Untitled.flac');
reader.pipe(new seektable(function(data) {
	console.log('* Got seek data');
	var output = fs.createWriteStream('out.flac', { flags: 'w' });
	substream(output, data, 60, 70, function(start, end) {
		console.log('  > requested stream for: %s:%s', start, end);
		var stream = fs.createReadStream(
			'02-Inigo_Kennedy_-_Untitled.flac',
			{
				start: start,
				end: end
			}
		);
		return stream;
	});
})).pipe(devnull());
