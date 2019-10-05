const { exec } = require('child_process')
const path = require('path')
const fs = require('fs')

const precision = 10

const getWaveform = function(input, callback) {
  console.log('input', input)
  console.log('exec', exec)
  exec('ffprobe -show_streams "' + input + '"', function(err, stdout, stderr) {
    if (err) {
      console.log('Error when gettin duration', err);
      return callback();
    }

    const durationRegex = /duration=(.*)/i

    if (durationRegex.test(stdout)) {
      const duration = parseInt(durationRegex.exec(stdout)[1]);
      const width = precision * duration;
      const samplejson = path.join(__dirname, 'sample' + Math.random().toString(36).substring(7) + '.json');
      const args = ['-i', "'" + input + "'", '-o', samplejson, '--pixels-per-second', precision.toString(), '-w', width.toString()];

      exec('audiowaveform ' + args.join(' '), function(err, stdout, stderr) {
        if (err || stderr) {
          console.log('Error when generating waveform', err, stderr);
          return callback();
        }


        fs.readFile(samplejson, function(err, data) {
          if (err) {
            console.log('Error when reading file');
            return callback();
          }

          const jsonOutput = JSON.parse(data).data;
          fs.unlink(samplejson, (err) => {
            if (err)
              console.log('Error when deleting sample.json',err);
          });
          let i, il
          const output = [];
          for (i = 0, il = jsonOutput.length; i < il; i+=2) {
            output.push(jsonOutput[i]);
          }
          const min = Math.min(...output);
          const max = Math.max(...output);

          for(i = 0, il = output.length; i < il; i++) {
            output[i] = parseFloat((1 - ((output[i] - min) / (max - min))).toFixed(3));
          }

          return callback(output);
        });
      });
    }
  });
}

export default getWaveform
