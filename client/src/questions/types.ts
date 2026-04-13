export type DimensionType =
  | 'dailyFunctioning'
  | 'sleepRegulation'
  | 'emotionRegulation'
  | 'attachment'
  | 'personalityFunctioning'
  | 'bigFive';

export interface ScaleConfig {
  points: number;
  labels: string[];
}

export interface QuestionItem {
  id: string;
  text: string;
  subscale: string;
  reverse: boolean;
}

export interface DomainSection {
  id: DimensionType;
  title: string;
  intro: string;
  timeframe: string;
  scale: ScaleConfig;
  items: QuestionItem[];
}
