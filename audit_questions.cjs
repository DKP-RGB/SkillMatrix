const fs = require('fs');
const questions = JSON.parse(fs.readFileSync('d:/DKP-RGB-SkillMatrix/src/data/questions.json', 'utf8'));

const counts = {};
questions.forEach(q => {
    const key = `${q.language} | ${q.topic} | ${q.type}`;
    counts[key] = (counts[key] || 0) + 1;
});

const sorted = Object.entries(counts).sort((a, b) => a[1] - b[1]);
console.log('Language | Topic | Type | Count');
console.log('-------------------------------');
sorted.forEach(([key, count]) => {
    console.log(`${key} : ${count}`);
});
