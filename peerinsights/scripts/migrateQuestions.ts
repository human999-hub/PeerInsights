// scripts/migrateQuestions.ts
import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local" });

import { connectDB } from "@/lib/mongodb";
import Question from "@/models/Question";

type Q = {
  qid: string;
  title: string;
  category?: string;
  description?: string;
  question_type: "scale" | "text" | "praise";
  scale_min?: number;
  scale_max?: number;
  scale_labels?: Record<string, string>;
  placeholder_template?: string;
  applies_to?: number[];
};

// Build the full survey in order (Q1..Q19)
const survey: Q[] = [
  // Q1–Q3 are already in your DB; this script will just set qid on them and upsert safely.
  {
    qid: "Q1",
    title: "Individual Contribution",
    category: "contribution",
    description: "Rate how much this teammate contributed to the team.",
    question_type: "scale",
    scale_min: 1,
    scale_max: 5,
    scale_labels: {
      "5": "Consistently goes beyond their required commitments. Did much more than others. Consistently makes important contributions that improve the team's work.",
      "4": "Often goes beyond their required commitments. Did more than others. Often makes important contributions that improve the team's work.",
      "3": "Completed their required commitments. Did a fair share of the team's work. Occasionally makes important contributions that improve the team's work.",
      "2": "Did not complete all of their required commitments, could have shared more of the workload. Has difficulty. Requires structure, directions and leadership.",
      "1": "Does not do a fair share of the team's work. Does not contribute.",
    },
  },
  {
    qid: "Q2",
    title: "Helping Others",
    category: "collaboration",
    description: "How much did this teammate help/support others?",
    question_type: "scale",
    scale_min: 1,
    scale_max: 5,
    scale_labels: {
      "5": "Monitors team members' progress and generously offers help and support to teammates who are having difficulty completing their work.",
      "4": "Notices when team members are having difficulty and makes an effort to offer help and support when convenient.",
      "3": "Helps teammates who ask for help.",
      "2": "Helps teammates who ask for help when it is convenient.",
      "1": "Does not help teammates even if asked.",
    },
  },
  {
    qid: "Q3",
    title: "Initiative",
    category: "initiative",
    description: "How independently and proactively do they work?",
    question_type: "scale",
    scale_min: 1,
    scale_max: 5,
    scale_labels: {
      "5": "Is very self-directed. Successfully problem-solves when faced with impasses or challenges.",
      "4": "Usually problem solves when faced with impasses or challenges. Almost never needs direction.",
      "3": "Tries to problem solve when faced with impasses or challenges but may not always be successful. Often needs direction.",
      "2": "Cannot problem solve and needs clear direction.",
      "1": "Cannot problem solve and does not take direction.",
    },
  },

  // Q4 .. Q17 — your new scale questions:
  {
    qid: "Q4",
    title: "Monitoring Progress",
    category: "execution",
    description:
      "How well does this teammate monitor team conditions and progress?",
    question_type: "scale",
    scale_min: 1,
    scale_max: 5,
    scale_labels: {
      "5": "Monitors conditions affecting the team and monitors the team's progress. Makes sure that teammates are making appropriate progress.",
      "4": "Makes an effort to watch conditions affecting the team and monitors the team's progress. Encourages teammates to make appropriate progress.",
      "3": "Notices changes that influence the team's success. Knows what everyone on the team should be doing and notices problems.",
      "2": "Is unaware of whether the team is meeting its goals. Does not pay attention to teammates' progress.",
      "1": "Does not care if the team is meeting its goals.",
    },
  },
  {
    qid: "Q5",
    title: "Participation",
    category: "participation",
    description:
      "Attendance, preparation, and active participation in meetings/discussions.",
    question_type: "scale",
    scale_min: 1,
    scale_max: 5,
    scale_labels: {
      "5": "Is on time for, prepares for and actively participates in all group meetings and discussions.",
      "4": "Is on time for, prepares for and actively participates in most group meetings and discussions.",
      "3": "Is on time for, prepares for and actively participates in some group meetings and discussions.",
      "2": "Is on time for, prepares for and actively participates in few group meetings and discussions.",
      "1": "Does not attend group meetings or discussions.",
    },
  },
  {
    qid: "Q6",
    title: "Asking for Help",
    category: "collaboration",
    description:
      "Proactiveness in seeking help relative to impact on progress.",
    question_type: "scale",
    scale_min: 1,
    scale_max: 5,
    scale_labels: {
      "5": "Proactively asks for help if it seems there will be an impact to progress.",
      "4": "Asks for help before there is an impact to progress.",
      "3": "Asks for help after there is an impact to progress.",
      "2": "Does not ask for help but accepts it when offered. Progress is impacted.",
      "1": "Does not ask for or accept help when needed even if it impacts progress.",
    },
  },
  {
    qid: "Q7",
    title: "Communication Timeliness",
    category: "communication",
    description: "Timely, professional, efficient communication.",
    question_type: "scale",
    scale_min: 1,
    scale_max: 5,
    scale_labels: {
      "5": "Always initiates and responds to communication in a timely, professional and efficient manner.",
      "4": "Usually initiates and responds to communication in a timely, professional and efficient manner.",
      "3": "Adequately initiates and responds to communication in a timely, professional and efficient manner.",
      "2": "Rarely initiates and responds to communication in a timely, professional and efficient manner.",
      "1": "Does not initiate or respond to communications in a timely, professional and efficient manner.",
    },
  },
  {
    qid: "Q8",
    title: "Project Management Updates",
    category: "execution",
    description: "Frequency and helpfulness of PM tool updates.",
    question_type: "scale",
    scale_min: 1,
    scale_max: 5,
    scale_labels: {
      "5": "Always makes at least daily updates to their tasks in the project management software. Makes sure that teammates are making appropriate updates.",
      "4": "Usually makes daily updates to their tasks in the project management software. Encourages teammates to make the appropriate updates.",
      "3": "Makes updates to their tasks in the project management software at least a few times a week. Is aware of when teammates are making the appropriate updates.",
      "2": "Only makes updates to their tasks in the project management software at the end of the sprints. Is unaware of when teammates make updates.",
      "1": "Does not make any updates to their tasks in the project management software. Does not care when teammates make updates.",
    },
  },
  {
    qid: "Q9",
    title: "Task Implementation Times",
    category: "planning",
    description: "Tracks actual time and adjusts estimates based on past work.",
    question_type: "scale",
    scale_min: 1,
    scale_max: 5,
    scale_labels: {
      "5": "Always accurately keeps track of and reports the actual time for implementation of tasks. Makes adjustments to future estimated times based on completed tasks.",
      "4": "Usually keeps track of and reports the actual time for implementation of tasks. Mostly makes adjustments to future estimated times based on completed tasks.",
      "3": "Adequately keeps track of and reports the actual time for implementation of tasks. Attempts, but may not be successful, to make adjustments to future estimated times based on completed tasks.",
      "2": "Occasionally keeps track of and reports the actual time for implementation of tasks. Makes unsuccessful attempts to make adjustments to future estimated times based on completed tasks.",
      "1": "Does not keep track of or report the actual time for implementation of tasks. Does not attempt to make adjustments to future estimated times based on completed tasks.",
    },
  },
  {
    qid: "Q10",
    title: "Communication Quality",
    category: "communication",
    description:
      "Listening, clarity, sharing information, letting all voices be heard.",
    question_type: "scale",
    scale_min: 1,
    scale_max: 5,
    scale_labels: {
      "5": "Asks for and shows an interest in teammates' ideas and contributions. Makes sure teammates stay informed and understand each other. Is effective in discussions, a good listener and lets all voices be heard.",
      "4": "Shows an interest in teammates' ideas and contributions. Makes sure teammates stay informed. Is effective in discussions and lets all voices be heard.",
      "3": "Listens to teammates and respects their contributions. Communicates clearly. Shares information with teammates. Is a good listener and lets all voices be heard.",
      "2": "Allows teammates to talk but does not listen or respect their contributions. Rarely shares information. Occasionally forgets to let all voices be heard.",
      "1": "Interrupts, ignores, bosses, or makes fun of teammates. Takes actions that affect teammates without their input. Does not share information.",
    },
  },
  {
    qid: "Q11",
    title: "Compromise",
    category: "teamwork",
    description:
      "Leads/encourages effective discussions to reach acceptable compromises and support decisions.",
    question_type: "scale",
    scale_min: 1,
    scale_max: 5,
    scale_labels: {
      "5": "Ensures effective discussions that lead to acceptable compromises. Ensures everyone supports team decisions.",
      "4": "Encourages effective discussions that lead to acceptable compromises. Encourages everyone to support team decisions.",
      "3": "Contributes to effective discussions that lead to acceptable compromises. Supports team decisions.",
      "2": "Does not contribute to effective discussions that lead to acceptable compromises. Does not support team decisions.",
      "1": "Actively derails effective discussions and attempts to avoid compromises. Attempts to dissuade support for team decisions.",
    },
  },
  {
    qid: "Q12",
    title: "Conflict",
    category: "teamwork",
    description:
      "Prevents, mediates, resolves conflicts; handles difficult conversations professionally.",
    question_type: "scale",
    scale_min: 1,
    scale_max: 5,
    scale_labels: {
      "5": "Takes steps to ensure conflicts do not occur. Mediates and resolves conflicts in the group. Handles difficult conversations promptly and professionally.",
      "4": "Attempts to prevent conflicts. Attempts to resolve conflicts in the group. Handles difficult conversations promptly and professionally.",
      "3": "Does not participate in conflict. Handles difficult conversations professionally but tries to avoid or delay them if possible.",
      "2": "Participates in conflicts in the group. Does not have difficult conversations.",
      "1": "Instigates conflicts in the group. Makes difficult conversations worse.",
    },
  },
  {
    qid: "Q13",
    title: "Attitude",
    category: "professionalism",
    description: "Respectful behavior and overall attitude toward the team.",
    question_type: "scale",
    scale_min: 1,
    scale_max: 5,
    scale_labels: {
      "5": "Treats all team members respectfully. Encourages others to treat everyone respectfully. Has a positive attitude, encourages and motivates team.",
      "4": "Treats all team members respectfully. Has a positive attitude.",
      "3": "Almost always treats team members respectfully with only minor slips. Their attitude does not bring down the team.",
      "2": "Tries to treat team members respectfully but is not completely successful. Their attitude is somewhat negative.",
      "1": "Does not make an effort to treat team members respectfully. Complains, makes excuses, or does not interact with teammates.",
    },
  },
  {
    qid: "Q14",
    title: "Motivation",
    category: "professionalism",
    description:
      "Drive to achieve excellent work and belief in team capabilities.",
    question_type: "scale",
    scale_min: 1,
    scale_max: 5,
    scale_labels: {
      "5": "Motivates the team to do excellent work. Cares that the team does outstanding work, even if there is no additional reward. Believes that the team can do excellent work.",
      "4": "Wants to do excellent work while earning all available rewards. Believes that the team can do excellent work.",
      "3": "Encourages the team to do good work that meets all requirements. Wants the team to perform well enough to earn all available rewards. Believes that the team can fully meet its responsibilities.",
      "2": "Wants to do the minimum amount of work at a passing level. Is ok not getting all the rewards. Believes the team can perform only at a passing level.",
      "1": "Satisfied even if the team does not meet assigned standards. Wants the team to avoid work, even if it hurts the team. Doubts that the team can meet its requirements.",
    },
  },
  {
    qid: "Q15",
    title: "Getting Feedback",
    category: "growth",
    description: "Seeks and uses feedback to improve.",
    question_type: "scale",
    scale_min: 1,
    scale_max: 5,
    scale_labels: {
      "5": "Asks teammates for feedback and uses their suggestions to improve.",
      "4": "Does not solicit feedback but accepts and uses feedback to improve.",
      "3": "Accepts feedback and uses it to improve if it does not require much effort or time.",
      "2": "Listens to feedback but generally does not use it to improve.",
      "1": "Is defensive. Will not accept help or advice from teammates.",
    },
  },
  {
    qid: "Q16",
    title: "Giving Feedback",
    category: "growth",
    description: "Provides thoughtful, constructive, professional feedback.",
    question_type: "scale",
    scale_min: 1,
    scale_max: 5,
    scale_labels: {
      "5": "Provides thoughtful feedback when they see a need. Feedback is professional, constructive, addresses a specific issue and offers a viable solution.",
      "4": "Provides thoughtful feedback when asked. Feedback is professional, constructive, addresses a specific issue and offers a viable solution.",
      "3": "Feedback is thoughtful, professional and constructive.",
      "2": "Does not provide much feedback. Feedback is professional but may not be thoughtful, constructive or appropriate to the situation.",
      "1": "Feedback is not professional and may be insulting.",
    },
  },
  {
    qid: "Q17",
    title: "Relevant knowledge, skills and abilities",
    category: "capability",
    description: "Knowledge/skills/ability for assigned role and growth.",
    question_type: "scale",
    scale_min: 1,
    scale_max: 5,
    scale_labels: {
      "5": "Demonstrates the knowledge, skills, and abilities to do excellent work for their assigned role. Acquires new knowledge or skills to improve the team's performance.",
      "4": "Demonstrates the knowledge, skills, and abilities to do good work for their assigned role. Acquires new knowledge or skills to improve their performance.",
      "3": "Demonstrates sufficient knowledge, skills, and abilities to adequately complete their work. Acquires knowledge or skills as needed to meet requirements.",
      "2": "Missing some knowledge, skills, or abilities to adequately complete their work. Acquires knowledge or skills as needed to meet requirements.",
      "1": "Missing basic qualifications needed to complete their tasks. Unable or unwilling to develop knowledge or skills to contribute to the team.",
    },
  },

  // Q18 – your text box after Q1–Q3
  {
    qid: "Q18",
    title: "Explain your answers / issues",
    category: "explanation",
    description:
      "After each rating, you may explain your answer or share any issues for that specific teammate.",
    question_type: "text",
    applies_to: [1, 2, 3],
  },

  // Q19 – Praise
  {
    qid: "Q19",
    title: "Praise",
    category: "recognition",
    description:
      "Is there anything you want to praise about this teammate? If so, for what?",
    question_type: "praise",
    placeholder_template:
      "Is there anything you want to praise about {{name}}? If so, for what?",
  },
];

async function main() {
  await connectDB();

  for (const q of survey) {
    // Match by title OR qid if it already exists
    await Question.updateOne(
      { $or: [{ qid: q.qid }, { title: q.title }] },
      { $set: { ...q } },
      { upsert: true }
    );
  }

  console.log("✅ Questions Q1–Q19 ensured (with qid).");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
