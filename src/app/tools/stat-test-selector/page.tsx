"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  ChevronLeft, 
  HelpCircle, 
  ArrowRight, 
  RotateCcw,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

type QuestionId = 'dataType' | 'categoricalGoal' | 'continuousGroups' | 'continuousRelation' | 'paired' | 'normal';

interface Option {
  label: string;
  description: string;
  nextStep?: QuestionId;
  result?: TestResult;
}

interface TestResult {
  name: string;
  description: string;
  assumptions: string[];
  alternative?: string;
}

const WIZARD_FLOW: Record<QuestionId, { question: string; options: Option[] }> = {
  dataType: {
    question: "What type of data are you analyzing?",
    options: [
      {
        label: "Continuous / Numerical",
        description: "Measurements like expression levels, concentration, height, weight, IC50.",
        nextStep: "continuousRelation"
      },
      {
        label: "Categorical / Nominal",
        description: "Discrete categories like Alive/Dead, Genotype (WT/KO), Cell Types, or True/False.",
        nextStep: "categoricalGoal"
      }
    ]
  },
  categoricalGoal: {
    question: "What is the goal of your analysis?",
    options: [
      {
        label: "Compare Proportions",
        description: "e.g., Does the proportion of dead cells differ between Treatment and Control?",
        result: {
          name: "Chi-Square Test of Independence",
          description: "Used to determine if there is a significant association between two categorical variables.",
          assumptions: ["Observations are independent.", "Expected frequency in each cell is at least 5."],
          alternative: "Fisher's Exact Test (if expected frequencies are < 5, i.e., very small sample sizes)."
        }
      },
      {
        label: "Time-to-Event (Survival)",
        description: "e.g., How long until mice die or tumors double in size?",
        result: {
          name: "Kaplan-Meier Survival Analysis & Log-Rank Test",
          description: "Estimates the survival probability over time and compares survival curves between groups.",
          assumptions: ["Censoring is independent of the event.", "Survival probabilities are the same for subjects recruited early and late in the study."],
          alternative: "Cox Proportional Hazards Model (if analyzing continuous covariates)."
        }
      },
      {
        label: "Predict Binary Outcome",
        description: "e.g., Does gene expression (continuous) predict disease status (yes/no)?",
        result: {
          name: "Logistic Regression",
          description: "Models the probability of a binary outcome based on one or more predictor variables.",
          assumptions: ["Linear relationship between independent variables and log-odds.", "Independent observations."],
          alternative: "Random Forest / SVM (for complex, non-linear machine learning prediction)."
        }
      }
    ]
  },
  continuousRelation: {
    question: "Are you comparing groups or analyzing a relationship/correlation?",
    options: [
      {
        label: "Comparing Groups",
        description: "I want to see if the mean/median differs between experimental conditions.",
        nextStep: "continuousGroups"
      },
      {
        label: "Analyzing Relationship (Correlation)",
        description: "I want to see if Variable X increases/decreases as Variable Y changes.",
        nextStep: "normal" // routes to correlation results
      }
    ]
  },
  continuousGroups: {
    question: "How many groups are you comparing?",
    options: [
      {
        label: "1 Group (vs Theoretical Mean)",
        description: "e.g., Is the average fold-change significantly different from 1.0?",
        nextStep: "normal" // will use special logic in render
      },
      {
        label: "2 Groups",
        description: "e.g., Control vs Treatment, or Wild-Type vs Knock-out.",
        nextStep: "paired"
      },
      {
        label: "3 or More Groups",
        description: "e.g., Control, Drug A, Drug B, and Drug C.",
        nextStep: "paired"
      }
    ]
  },
  paired: {
    question: "Are the samples independent or paired?",
    options: [
      {
        label: "Independent Samples",
        description: "Different subjects/cells in each group (e.g., Group A gets drug, Group B gets vehicle).",
        nextStep: "normal"
      },
      {
        label: "Paired / Repeated Measures",
        description: "Same subjects measured multiple times (e.g., patient blood pressure before and after drug).",
        nextStep: "normal"
      }
    ]
  },
  normal: {
    question: "Is your data normally distributed (Parametric)?",
    options: [
      {
        label: "Yes (Parametric)",
        description: "Data roughly follows a bell curve. Variances between groups are roughly equal.",
        result: undefined // Calculated dynamically based on history
      },
      {
        label: "No / Unsure (Non-parametric)",
        description: "Data is highly skewed, contains extreme outliers, or sample size is very small (N < 5).",
        result: undefined // Calculated dynamically
      }
    ]
  }
};

export default function TestSelectorWizard() {
  const [history, setHistory] = useState<{ questionId: QuestionId; answer: string }[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionId>('dataType');
  const [result, setResult] = useState<TestResult | null>(null);

  const handleSelect = (option: Option) => {
    const newHistory = [...history, { questionId: currentQuestion, answer: option.label }];
    setHistory(newHistory);

    if (option.result) {
      setResult(option.result);
      return;
    }

    if (currentQuestion === 'normal') {
      // Dynamic result resolution based on accumulated history
      resolveFinalTest(newHistory, option.label === "Yes (Parametric)");
      return;
    }

    if (option.nextStep) {
      setCurrentQuestion(option.nextStep);
    }
  };

  const resolveFinalTest = (path: { questionId: string; answer: string }[], isParametric: boolean) => {
    const isCorrelation = path.find(p => p.questionId === 'continuousRelation')?.answer.includes("Correlation");
    const numGroups = path.find(p => p.questionId === 'continuousGroups')?.answer;
    const isPaired = path.find(p => p.questionId === 'paired')?.answer.includes("Paired");

    let finalResult: TestResult | null = null;

    if (isCorrelation) {
      if (isParametric) {
        finalResult = {
          name: "Pearson Correlation Coefficient",
          description: "Measures the linear relationship between two continuous variables.",
          assumptions: ["Continuous data.", "Normal distribution for both variables.", "Linear relationship."],
          alternative: "Simple Linear Regression (if you want to predict Y from X)."
        };
      } else {
        finalResult = {
          name: "Spearman Rank Correlation",
          description: "A non-parametric test that measures the monotonic relationship between two variables.",
          assumptions: ["Variables are measured on at least an ordinal scale.", "Monotonic relationship (not necessarily linear)."],
          alternative: "Kendall's Tau (better for very small samples with many tied ranks)."
        };
      }
    } else if (numGroups?.includes("1 Group")) {
      if (isParametric) {
        finalResult = {
          name: "One-Sample t-test",
          description: "Determines whether the sample mean is statistically different from a known or hypothesized population mean.",
          assumptions: ["Continuous data.", "Normally distributed population.", "Independent observations."],
          alternative: "None."
        };
      } else {
        finalResult = {
          name: "One-Sample Wilcoxon Signed-Rank Test",
          description: "Non-parametric alternative to the one-sample t-test. Compares the median to a hypothetical value.",
          assumptions: ["Data is symmetric around the median."],
          alternative: "Sign Test (if distribution is highly asymmetrical)."
        };
      }
    } else if (numGroups?.includes("2 Groups")) {
      if (isPaired) {
        if (isParametric) {
          finalResult = {
            name: "Paired Student's t-test",
            description: "Compares the means of two related groups to determine if there is a statistically significant difference.",
            assumptions: ["Differences between pairs are normally distributed.", "Continuous data."],
            alternative: "None."
          };
        } else {
          finalResult = {
            name: "Wilcoxon Signed-Rank Test",
            description: "Non-parametric test comparing two related samples, matched samples, or repeated measurements.",
            assumptions: ["Pairs are randomly and independently drawn.", "Distribution of differences is symmetric."],
            alternative: "Sign Test."
          };
        }
      } else {
        // Independent 2 groups
        if (isParametric) {
          finalResult = {
            name: "Unpaired Student's t-test",
            description: "Compares the means of two independent groups.",
            assumptions: ["Normal distribution.", "Equal variances (homoscedasticity).", "Independent observations."],
            alternative: "Welch's t-test (highly recommended if variances are unequal)."
          };
        } else {
          finalResult = {
            name: "Mann-Whitney U Test (Wilcoxon Rank-Sum)",
            description: "Non-parametric test comparing outcomes between two independent groups.",
            assumptions: ["Observations are independent.", "Responses are ordinal or continuous."],
            alternative: "Kolmogorov-Smirnov Test (compares full distributions, not just medians)."
          };
        }
      }
    } else if (numGroups?.includes("3 or More")) {
      if (isPaired) {
        if (isParametric) {
          finalResult = {
            name: "Repeated Measures ANOVA",
            description: "Compares means across 3 or more related groups (e.g., timepoints).",
            assumptions: ["Sphericity (variances of differences between all combinations of related groups are equal).", "Normal distribution."],
            alternative: "Mixed-Effects Model (handles missing data better)."
          };
        } else {
          finalResult = {
            name: "Friedman Test",
            description: "Non-parametric alternative to one-way repeated measures ANOVA.",
            assumptions: ["Data is measured at least at ordinal level."],
            alternative: "None."
          };
        }
      } else {
        // Independent 3+ groups
        if (isParametric) {
          finalResult = {
            name: "One-Way ANOVA",
            description: "Compares means of 3 or more independent groups. Must be followed by a Post-Hoc test (e.g., Tukey) if significant.",
            assumptions: ["Normal distribution in each group.", "Equal variances.", "Independent observations."],
            alternative: "Brown-Forsythe ANOVA (if variances are unequal)."
          };
        } else {
          finalResult = {
            name: "Kruskal-Wallis H Test",
            description: "Non-parametric alternative to one-way ANOVA. Must be followed by Dunn's test if significant.",
            assumptions: ["Independent observations.", "Similar distribution shapes across groups."],
            alternative: "None."
          };
        }
      }
    }

    if (finalResult) setResult(finalResult);
  };

  const resetWizard = () => {
    setHistory([]);
    setCurrentQuestion('dataType');
    setResult(null);
  };

  const goBack = () => {
    if (history.length === 0) return;
    const newHistory = [...history];
    newHistory.pop();
    setHistory(newHistory);
    setCurrentQuestion(newHistory.length > 0 ? newHistory[newHistory.length - 1].questionId : 'dataType');
    
    // Actually, if we go back, the current question should be the one we just popped from history.
    // Wait, history stores { questionId: the question that WAS answered, answer: what they picked }
    // So if history length is 1 (we are on question 2), and we pop it, history length is 0. 
    // The question to ask is 'dataType'.
    // If history length is 2 (we are on question 3), we pop it, history length is 1. 
    // The last element in history was question 1, and its answer led to question 2.
    // To do this easily, we can re-evaluate the flow from the start up to newHistory.
    
    let nextQ: QuestionId = 'dataType';
    for (const step of newHistory) {
      const option = WIZARD_FLOW[step.questionId].options.find(o => o.label === step.answer);
      if (option?.nextStep) nextQ = option.nextStep;
    }
    setCurrentQuestion(nextQ);
    setResult(null);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-6 text-slate-200">
      <div className="w-full max-w-5xl space-y-6">
        
        <div className="w-full">
          <Link href="/tools/stats" className="inline-flex items-center text-sm text-blue-400 hover:text-blue-300 w-fit">
            <ChevronLeft size={16} className="mr-1" /> Back to Experimental Design & Statistics
          </Link>
        </div>

        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white flex items-center justify-center gap-3">
            <HelpCircle className="text-blue-500 w-10 h-10" />
            Statistical Test Selector
          </h1>
          <p className="text-slate-400 mt-3 text-lg">
            Answer a few questions about your experimental design to find the correct statistical test.
          </p>
        </header>

        <div className="bg-slate-800/60 rounded-2xl border border-slate-700/50 shadow-2xl backdrop-blur-md overflow-hidden transition-all duration-500">
          
          {/* Progress Bar / Breadcrumbs */}
          <div className="bg-slate-900/50 px-6 py-4 border-b border-slate-700/50 flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-slate-500">Start</span>
              {history.map((step, idx) => (
                <React.Fragment key={idx}>
                  <ChevronLeft size={14} className="text-slate-600 rotate-180" />
                  <span className="text-blue-400 truncate max-w-[150px]" title={step.answer}>
                    {step.answer}
                  </span>
                </React.Fragment>
              ))}
              {result && (
                <>
                  <ChevronLeft size={14} className="text-slate-600 rotate-180" />
                  <span className="text-emerald-400 font-medium">Result</span>
                </>
              )}
            </div>
            
            <div className="flex gap-2">
              {history.length > 0 && !result && (
                <button 
                  onClick={goBack}
                  className="flex items-center gap-1 text-slate-400 hover:text-white px-3 py-1 rounded-md transition-colors text-sm"
                >
                  <ChevronLeft size={14} /> Back
                </button>
              )}
              {history.length > 0 && (
                <button 
                  onClick={resetWizard}
                  className="flex items-center gap-1 text-slate-400 hover:text-red-400 px-3 py-1 rounded-md transition-colors text-sm"
                >
                  <RotateCcw size={14} /> Reset
                </button>
              )}
            </div>
          </div>

          <div className="p-8 md:p-12 min-h-[400px] flex flex-col justify-center">
            
            {/* Question State */}
            {!result && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto w-full">
                <h2 className="text-2xl md:text-3xl font-semibold text-white mb-8 text-center">
                  {WIZARD_FLOW[currentQuestion].question}
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {WIZARD_FLOW[currentQuestion].options.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelect(option)}
                      className="group flex flex-col items-start p-6 bg-slate-800 border border-slate-600 hover:border-blue-500 hover:bg-slate-700/80 rounded-xl transition-all duration-200 text-left hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]"
                    >
                      <span className="text-lg font-medium text-white mb-2 group-hover:text-blue-400 flex items-center justify-between w-full">
                        {option.label}
                        <ArrowRight size={18} className="opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all" />
                      </span>
                      <span className="text-sm text-slate-400">
                        {option.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Result State */}
            {result && (
              <div className="animate-in zoom-in-95 fade-in duration-500 max-w-3xl mx-auto w-full">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mb-4">
                    <CheckCircle2 size={32} />
                  </div>
                  <h2 className="text-sm uppercase tracking-widest text-emerald-500 font-semibold mb-2">Recommended Test</h2>
                  <h3 className="text-3xl md:text-4xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400 pb-2">
                    {result.name}
                  </h3>
                </div>
                
                <div className="bg-slate-800/80 rounded-xl border border-emerald-500/30 p-6 mb-6 shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                  <p className="text-lg text-slate-200 mb-4 leading-relaxed">
                    {result.description}
                  </p>
                  
                  <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
                      <AlertCircle size={16} className="text-amber-500" />
                      Key Assumptions to verify
                    </h4>
                    <ul className="list-disc pl-5 space-y-2 text-slate-400 text-sm">
                      {result.assumptions.map((assump, idx) => (
                        <li key={idx}>{assump}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {result.alternative && (
                  <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-5 flex items-start gap-4">
                    <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg shrink-0">
                      <RotateCcw size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-300 mb-1">Alternative approach</h4>
                      <p className="text-sm text-slate-400">{result.alternative}</p>
                    </div>
                  </div>
                )}
                
                <div className="mt-10 text-center">
                  <button 
                    onClick={resetWizard}
                    className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors shadow-lg hover:shadow-xl"
                  >
                    Start New Analysis
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
