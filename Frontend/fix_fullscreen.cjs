const fs = require('fs');

const replacements = [
    {
        file: 'src/pages/UserAccount.jsx',
        from: /md:py-10"/g,
        to: '"'
    },
    {
        file: 'src/pages/UserAccount.jsx',
        from: /md:max-w-4xl md:rounded-3xl min-h-\[100dvh\] md:min-h-0 bg-slate-50 shadow-xl flex flex-col relative md:overflow-hidden/g,
        to: 'md:max-w-none md:w-full md:rounded-none min-h-[100dvh] bg-slate-50 flex flex-col relative md:overflow-hidden'
    },
    {
        file: 'src/pages/UserRides.jsx',
        from: /md:py-10"/g,
        to: '"'
    },
    {
        file: 'src/pages/UserRides.jsx',
        from: /md:max-w-4xl min-h-\[100dvh\] md:min-h-0 md:rounded-3xl md:overflow-hidden bg-white shadow-xl flex flex-col/g,
        to: 'md:max-w-none md:w-full min-h-[100dvh] md:rounded-none md:overflow-hidden bg-slate-50 md:bg-slate-50 flex flex-col'
    },
    {
        file: 'src/pages/Riding.jsx',
        from: /md:py-8"/g,
        to: '"'
    },
    {
        file: 'src/pages/Riding.jsx',
        from: /md:max-w-6xl h-\[100dvh\] md:h-\[85vh\] bg-slate-100 md:bg-white overflow-hidden shadow-2xl flex flex-col md:flex-row-reverse md:rounded-\[32px\]/g,
        to: 'md:max-w-none md:w-full h-[100dvh] bg-slate-100 md:bg-white overflow-hidden flex flex-col md:flex-row-reverse'
    },
    {
        file: 'src/pages/CaptainRiding.jsx',
        from: /md:py-8"/g,
        to: '"'
    },
    {
        file: 'src/pages/CaptainRiding.jsx',
        from: /md:max-w-6xl h-\[100dvh\] md:h-\[85vh\] bg-slate-100 overflow-hidden shadow-2xl flex flex-col md:flex-row-reverse md:rounded-\[32px\]/g,
        to: 'md:max-w-none md:w-full h-[100dvh] bg-slate-100 overflow-hidden flex flex-col md:flex-row-reverse'
    },
    {
        file: 'src/pages/CaptainAccount.jsx',
        from: /md:py-10"/g,
        to: '"'
    },
    {
        file: 'src/pages/CaptainAccount.jsx',
        from: /md:max-w-4xl md:rounded-3xl md:shadow-xl bg-\[#fff8f5\]/g,
        to: 'md:max-w-none md:w-full md:rounded-none md:shadow-none bg-[#fff8f5]'
    }
];

replacements.forEach(rep => {
    if (fs.existsSync(rep.file)) {
        let content = fs.readFileSync(rep.file, 'utf8');
        let newContent = content.replace(rep.from, rep.to);
        if(content !== newContent) {
            fs.writeFileSync(rep.file, newContent, 'utf8');
            console.log(`Updated ${rep.file}`);
        } else {
            console.log(`No exact match in ${rep.file} for ${rep.from}`);
        }
    }
});
