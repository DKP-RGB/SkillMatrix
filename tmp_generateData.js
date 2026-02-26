import fs from 'fs';

const data = JSON.parse(fs.readFileSync('d:/DKP-RGB-SkillMatrix/src/data/questions.json', 'utf8'));

const languages = ['C', 'C++', 'Python', 'Java', 'JavaScript', 'Go'];

const arrayQuestionTemplates = [
    {
        topic: "Arrays",
        difficulty: "easy",
        type: "mcq",
        question: "How do you access the first element of an array named 'arr'?",
        options: ["arr[1]", "arr[0]", "arr.first()", "arr.get(0)"],
        correctAnswer: "arr[0]",
        timeLimit: 30
    },
    {
        topic: "Arrays",
        difficulty: "easy",
        type: "mcq",
        question: "What is typically the index of the last element in an array of size N?",
        options: ["N", "N-1", "N+1", "1"],
        correctAnswer: "N-1",
        timeLimit: 30
    },
    {
        topic: "Arrays",
        difficulty: "medium",
        type: "code",
        question: "Write code to print the second element of an array initialized with {10, 20, 30}.",
        expectedOutput: "20",
        timeLimit: 60
    },
    {
        topic: "Arrays",
        difficulty: "medium",
        type: "code",
        question: "Write code to output the sum of the first two elements of an array containing {5, 5}.",
        expectedOutput: "10",
        timeLimit: 60
    },
    {
        topic: "Arrays",
        difficulty: "hard",
        type: "code",
        question: "Write a program that initializes an array of size 3 with values {1, 2, 3} and prints the last element.",
        expectedOutput: "3",
        timeLimit: 90
    }
];

let nextId = 32;
const newQuestions = [];

languages.forEach(lang => {
    arrayQuestionTemplates.forEach(template => {
        newQuestions.push({
            id: `q${nextId++}`,
            language: lang,
            ...template
        });
    });
});

const merged = [...data, ...newQuestions];
fs.writeFileSync('d:/DKP-RGB-SkillMatrix/src/data/questions.json', JSON.stringify(merged, null, 4));
console.log('Successfully injected 30 new Array questions to solve engine exhaustion.');
