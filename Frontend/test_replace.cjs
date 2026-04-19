console.log('Using \\\\$&: ' + 'text-[#F5]'.replace(/([[\]#/:.])/g, '\\$&'));
console.log('Using func string \\\\ + m: ' + 'text-[#F5]'.replace(/([[\]#/:.])/g, (m) => '\\' + m));
