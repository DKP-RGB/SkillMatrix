/**
 * JDoodle Code Execution Utility
 * Uses VITE_JDOODLE_CLIENT_ID and VITE_JDOODLE_CLIENT_SECRET from .env
 */

const JDOODLE_API_URL = 'https://api.jdoodle.com/v1/execute';

// Language Mapping for JDoodle
// Refer to: https://www.jdoodle.com/compiler-api/ (Languages and versionIndexes)
const LANGUAGE_MAP = {
    'Python': { language: 'python3', versionIndex: '4' },
    'C': { language: 'c', versionIndex: '5' },
    'C++': { language: 'cpp17', versionIndex: '1' },
    'JavaScript': { language: 'nodejs', versionIndex: '4' }
};

export const executeCode = async (language, sourceCode) => {
    const langConfig = LANGUAGE_MAP[language];

    if (!langConfig) {
        throw new Error(`Language ${language} is not supported on JDoodle.`);
    }

    const clientId = import.meta.env.VITE_JDOODLE_CLIENT_ID;
    const clientSecret = import.meta.env.VITE_JDOODLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error('JDoodle API keys are missing. Please check your .env file.');
    }

    try {
        const response = await fetch(JDOODLE_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                clientId,
                clientSecret,
                script: sourceCode,
                language: langConfig.language,
                versionIndex: langConfig.versionIndex
            })
        });

        const data = await response.json();

        // JDoodle returns 'output' and 'statusCode'
        if (data.output !== undefined) {
            // JDoodle combines stdout/stderr in 'output'
            return {
                output: data.output,
                stdout: data.output, // Simplified for UI
                stderr: data.statusCode === 200 ? '' : data.output, // Approximation
                cpuTime: data.cpuTime,
                memory: data.memory
            };
        } else {
            throw new Error(data.error || 'JDoodle execution error.');
        }
    } catch (error) {
        console.error('JDoodle Execution Error:', error);
        throw error;
    }
};

export const getBoilerplate = (language) => {
    switch (language) {
        case 'C':
            return `#include <stdio.h>\n\nint main() {\n    printf("Hello SkillMatrix!\\n");\n    return 0;\n}`;
        case 'C++':
            return `#include <iostream>\n\nint main() {\n    std::cout << "Hello SkillMatrix!" << std::endl;\n    return 0;\n}`;
        case 'Python':
            return `# SkillMatrix Python Workspace\nprint("Hello SkillMatrix!")`;
        case 'JavaScript':
            return `// SkillMatrix Node.js Workspace\nconsole.log("Hello SkillMatrix!");`;
        default:
            return `// Write your code here`;
    }
};
