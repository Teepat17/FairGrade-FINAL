import { createWorker } from 'tesseract.js';

// Initialize Tesseract worker
let worker: Tesseract.Worker | null = null;

export async function initializeOCR() {
  if (!worker) {
    worker = await createWorker();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
  }
}

export async function processImage(imageFile: File): Promise<string> {
  if (!worker) {
    await initializeOCR();
  }
  const result = await worker!.recognize(imageFile);
  return result.data.text;
}

// Function to parse rubric text into criteria
function parseRubric(rubricText: string): Array<{name: string, weight: number}> {
  return rubricText.split('\n')
    .map(line => {
      const match = line.match(/(.*?)\s*\((\d+)%\)/);
      if (match) {
        return {
          name: match[1].trim(),
          weight: parseInt(match[2], 10)
        };
      }
      return null;
    })
    .filter((item): item is {name: string, weight: number} => item !== null);
}

interface AIResponse {
  score: number;
  feedback: string;
  suggestions: string[];
}

// Function to convert File to base64
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

// Function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Function to retry with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let retries = 0;
  let currentDelay = initialDelay;
  
  while (true) {
    try {
      return await fn();
    } catch (error) {
      retries++;
      
      // Check if it's a rate limit error
      const isRateLimitError = error instanceof Error && 
        (error.message.includes('429') || 
         error.message.includes('RESOURCE_EXHAUSTED') || 
         error.message.includes('quota'));
      
      if (isRateLimitError && retries <= maxRetries) {
        console.log(`Rate limit hit, retrying in ${currentDelay}ms (attempt ${retries}/${maxRetries})`);
        await delay(currentDelay);
        currentDelay *= 2; // Exponential backoff
        continue;
      }
      
      // If it's not a rate limit error or we've exhausted retries, rethrow
      throw error;
    }
  }
}

// Function to call the AI API
async function callAIAPI(prompt: string): Promise<string> {
  const API_KEY = process.env.NEXT_PUBLIC_AI_API_KEY;
  const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

  if (!API_KEY) {
    throw new Error('AI API key missing. Please check your .env.local file.');
  }

  const response = await fetch(`${API_URL}?key=${API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 128,
        topP: 0.8,
        topK: 40
      }
    })
  });

  if (!response.ok) {
    throw new Error(`AI API request failed: ${response.statusText}`);
  }

  const data = await response.json();
  if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
    throw new Error('Invalid AI API response');
  }

  return data.candidates[0].content.parts[0].text;
}

// Function to call the AI API with file
export async function callAIAPIWithFile(file: File, prompt: string, answerKey?: File): Promise<string> {
  const API_KEY = process.env.NEXT_PUBLIC_AI_API_KEY;
  const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

  if (!API_KEY) {
    throw new Error('AI API key missing. Please check your .env.local file.');
  }

  try {
  // Convert file to base64
  const base64File = await fileToBase64(file);
    let base64AnswerKey = '';
    
    if (answerKey) {
      base64AnswerKey = await fileToBase64(answerKey);
    }

    return retryWithBackoff(async () => {
      // Prepare the request body
      const requestBody = {
      contents: [{
        parts: [
            { text: prompt },
          {
            inline_data: {
              mime_type: file.type,
              data: base64File.split(',')[1] // Remove the data URL prefix
            }
          }
        ]
      }],
      generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1024,
        topP: 0.8,
        topK: 40
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      };

      // Add answer key if provided
      if (base64AnswerKey) {
        requestBody.contents[0].parts.push({
          inline_data: {
            mime_type: answerKey!.type,
            data: base64AnswerKey.split(',')[1] // Remove the data URL prefix
          }
        });
      }

      const response = await fetch(`${API_URL}?key=${API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
        const errorData = await response.json();
        console.error('AI API error:', errorData);
        throw new Error(`AI API request failed: ${response.statusText} - ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        console.error('Invalid AI API response:', data);
        throw new Error('Invalid AI API response format');
  }

  return data.candidates[0].content.parts[0].text;
    });
  } catch (error) {
    console.error('Error calling AI API:', error);
    throw error;
  }
}

// Modified gradeCriterion function to only handle files
async function gradeCriterion(answer: File, criterionName: string, maxScore: number, subject: string, answerKey?: File): Promise<{
  score: number;
  feedback: string;
}> {
  try {
    let prompt = `You are an kind and helpful expert ${subject} grader. Evaluate this exam based on: ${criterionName} answer in bullet point form
      do not include * or ** or bold text
      SCORE: [number between 0 and ${maxScore}]
      STRENGTHS: [summary point]
      WEAKNESSES: [summary point]
      ANALYSIS:[summary point]
      SUGGESTIONS: [summary point]`;

    if (answerKey) {
      prompt = `You are an kind and helpful expert ${subject} grader. Compare the student's answer with the provided answer key and evaluate based on: ${criterionName}
        do not include * or ** or bold text
    SCORE: [number between 0 and ${maxScore}]
        STRENGTHS: [summary point]
        WEAKNESSES: [summary point]
        ANALYSIS: [Compare student's answer with the answer key, highlighting similarities and differences]
        SUGGESTIONS: [summary point]`;
    }
    
    const response = await callAIAPIWithFile(answer, prompt, answerKey);
    
    // Parse the response to extract score
    const scoreMatch = response.match(/SCORE:\s*(\d+)/i);
    if (!scoreMatch) {
      console.error('Could not find score in AI response:', response);
      throw new Error('AI response did not contain a valid score');
    }
    
    const score = parseInt(scoreMatch[1], 10);
    if (isNaN(score) || score < 0 || score > maxScore) {
      console.error('Invalid score in AI response:', score);
      throw new Error('AI response contained an invalid score');
    }

    // Split the response into sections and clean up
    const sections = response.split(/(?=SCORE:|STRENGTHS:|WEAKNESSES:|ANALYSIS:|SUGGESTIONS:)/i)
      .filter(Boolean)
      .map(section => section.trim());

    // Format bullet points for each section
    const formatBulletPoints = (text: string) => {
      return text
        .split(/[•*]\s*/)  // Split on either • or * bullets
        .filter(Boolean)
        .map(point => point.trim())
        .filter(point => point.length > 0)  // Remove empty points
        .map(point => `  • ${point}`)  // Add consistent bullet point format
        .join('\n');
    };

    // Extract and format each section
    const formattedSections = sections.map(section => {
      if (section.startsWith('SCORE:')) {
        return `SCORE:${section.replace('SCORE:', '').trim()}`;
      }
      
      const [header, ...content] = section.split('\n');
      const sectionContent = content.join(' ').trim();
      
      if (header.includes('ANALYSIS:')) {
        return `ANALYSIS:\n  ${sectionContent}`;
      }
      
      if (header.includes('STRENGTHS:') || header.includes('WEAKNESSES:') || header.includes('SUGGESTIONS:')) {
        return `${header}\n${formatBulletPoints(sectionContent)}`;
      }
      
      return section;
    });

    // Join sections with proper spacing
    const formattedFeedback = formattedSections
      .join('\n\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return {
      score: score,
      feedback: formattedFeedback
    };
  } catch (error: unknown) {
    console.error('AI grading error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      score: Math.floor(maxScore * 0.7),
      feedback: `Unable to perform AI grading: ${errorMessage}. Please review manually.`
    };
  }
}

export async function processStudentAnswers(
  studentFiles: File[],
  rubricText: string,
  answerKey?: File
): Promise<Array<{
  id: string;
  name: string;
  score: number;
  feedback: string;
  criteria: Array<{
    name: string;
    score: number;
    maxScore: number;
    feedback: string;
  }>;
}>> {
  const criteria = parseRubric(rubricText);
  const results = [];
  
  // Process files sequentially instead of in parallel
  for (const file of studentFiles) {
    // Process criteria sequentially for each file
    const criteriaResults = [];
    for (const criterion of criteria) {
      const maxScore = criterion.weight;
      const { score, feedback } = await gradeCriterion(file, criterion.name, maxScore, "", answerKey);
      criteriaResults.push({
        name: criterion.name,
        score,
        maxScore,
        feedback
      });
      
      // Add a small delay between criteria to avoid rate limiting
      await delay(500);
    }
    
    const totalScore = Math.round(
      criteriaResults.reduce((sum, criterion) => sum + criterion.score, 0) /
      criteriaResults.reduce((sum, criterion) => sum + criterion.maxScore, 0) * 100
    );
    
    const overallFeedback = totalScore >= 80 ? "Excellent work overall!" :
                           totalScore >= 60 ? "Good work with room for improvement." :
                           totalScore >= 40 ? "Needs significant improvement." :
                           "Requires extensive revision.";
    
    results.push({
      id: `student-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: file.name.replace(/\.[^/.]+$/, ""),
      score: totalScore,
      feedback: overallFeedback,
      criteria: criteriaResults
    });
    
    // Add a delay between files to avoid rate limiting
    await delay(1000);
  }
  
  return results;
} 