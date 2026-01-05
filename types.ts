export interface ExtractedInfo {
  companyName: string;
  personName: string;
}

export interface EmailTemplateData {
  senderName: string;
  eventName: string;
  extractedInfo: ExtractedInfo;
}

export interface GeneratedEmail {
  subject: string;
  body: string;
}

export enum InputMode {
  IMAGE = 'IMAGE',
  TEXT = 'TEXT'
}
