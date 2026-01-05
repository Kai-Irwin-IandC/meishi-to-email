import { EmailTemplateData, GeneratedEmail } from './types';

// The template requires strict adherence to the prompt
export const generateEmailContent = (data: EmailTemplateData): GeneratedEmail => {
  const { senderName, eventName, extractedInfo } = data;
  const { companyName, personName } = extractedInfo;

  // XXX Construction: [Company Name]　[Person Name] 様
  // Using full-width space as is common in Japanese business correspondence
  const recipientBlock = `${companyName}　${personName} 様`;

  // YYY: Sender Name
  // ZZZ: Event Name

  // Subject updated: 【御礼】ZZZ（Irwin&Co 生成AI）
  const subject = `【御礼】${eventName}（Irwin&Co 生成AI）`;

  const body = `${recipientBlock}

お世話になっております。Irwin&co株式会社の${senderName}でございます。
昨日の${eventName}では、貴重なお時間をいただき誠にありがとうございました。

弊社では現在、生成AIを活用したコンサルティング、受託開発を主力事業として行っております。
不動産・建設領域向けの パース生成AIの構築・マイソクPDFデータの読み取り等に強みがある企業となっております。
会社紹介資料を添付しておりますので、お手すきの際にご確認いただけますと幸いです。
ご興味ございましたらご回答いただけますと幸いです。

何卒よろしくお願い申し上げます。`;

  return {
    subject,
    body
  };
};

export const INITIAL_SENDER_NAME = "田中康太郎";
export const INITIAL_EVENT_NAME = "異業種交流会";