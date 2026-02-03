import { BriefAnswers } from "./types";

export function buildPrompt(answers: BriefAnswers): string {
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `You are a professional project brief writer. Based on the following project information, generate a comprehensive, well-structured project brief in Markdown format.

The brief should be professional, clear, and ready to share with a client or team.

## Project Information

**Project Type:** ${answers.projectType}
**Client Information:** ${answers.clientInfo}
**Project Goals:** ${answers.goals}
**Target Audience:** ${answers.targetAudience}
**Expected Deliverables:** ${answers.deliverables}
**Timeline:** ${answers.timeline}
**Budget:** ${answers.budget || "Not specified"}
**Constraints & Requirements:** ${answers.constraints || "None specified"}

## Output Format

Generate the brief with these exact sections:

# Project Brief: [Infer a clear project title]

## 1. Project Overview
A concise summary of the project (2-3 sentences).

## 2. Client Profile
Company info, industry, and context.

## 3. Objectives
Numbered list of clear, measurable objectives.

## 4. Target Audience
Detailed description of the end users.

## 5. Scope & Deliverables
Detailed list of what will be delivered.

## 6. Out of Scope
What is explicitly NOT included (important for preventing scope creep).

## 7. Timeline & Milestones
Phases with dates/durations.

## 8. Budget
Budget range and payment structure if applicable.

## 9. Technical Requirements
Technical constraints, platforms, integrations.

## 10. Success Criteria
How will we measure if the project is successful?

IMPORTANT: Write the brief in a professional tone. Be specific and actionable. Do not add disclaimers or meta-commentary. Output ONLY the Markdown brief without any footer or signature.`;
}
