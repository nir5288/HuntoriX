interface RichJobDescriptionProps {
  description: string;
}

export function RichJobDescription({ description }: RichJobDescriptionProps) {
  // Terms to bold - job titles, tech terms, years, key concepts
  const boldTerms = [
    // Job titles
    /\b(Full Stack Developer|Software Engineer|Backend Developer|Frontend Developer|DevOps Engineer|Data Scientist|Product Manager|QA Engineer|Mobile Developer|SRE|Algorithm Engineer|Cybersecurity Engineer)\b/gi,
    
    // Years of experience
    /\b(\d+-\d+\s+years?|\d+\+?\s+years?)\b/gi,
    
    // Technologies & Frameworks
    /\b(Java|Spring Framework|React|TypeScript|JavaScript|Python|Node\.js|AWS|Azure|GCP|Kubernetes|Docker|MongoDB|PostgreSQL|MySQL|Redis|Elasticsearch|Solr|ETL|REST APIs?|GraphQL|CI\/CD|Jenkins|Terraform|Ansible|Microservices?|Lambda)\b/gi,
    
    // Cloud & Architecture
    /\b(cloud-native|cloud-based|serverless|microservices architecture|distributed systems?|scalable|enterprise-grade)\b/gi,
    
    // AI & Data
    /\b(AI|ML|Machine Learning|Artificial Intelligence|Azure OpenAI|OpenAI|Cognitive Services|search engines?|data engineering|intelligent search|automation workflows?|chatbots?)\b/gi,
    
    // Qualifications & Skills
    /\b(Bachelor'?s degree|Master'?s degree|Computer Science|Software Engineering|enterprise applications?|relational databases?|NoSQL databases?|SQL databases?)\b/gi,
    
    // Job terms
    /\b(end-to-end ownership|cross-functional teams?|fast-paced environment|business-critical|full-time|part-time|contract|remote|hybrid|on-site)\b/gi,
  ];

  const formatText = (text: string): JSX.Element[] => {
    const parts: JSX.Element[] = [];
    let lastIndex = 0;
    const matches: Array<{ index: number; length: number; text: string }> = [];

    // Find all matches
    boldTerms.forEach(regex => {
      const regexCopy = new RegExp(regex.source, regex.flags);
      let match;
      while ((match = regexCopy.exec(text)) !== null) {
        matches.push({
          index: match.index,
          length: match[0].length,
          text: match[0]
        });
      }
    });

    // Sort matches by index and remove overlaps
    matches.sort((a, b) => a.index - b.index);
    const uniqueMatches = matches.filter((match, i) => {
      if (i === 0) return true;
      const prev = matches[i - 1];
      return match.index >= prev.index + prev.length;
    });

    // Build the formatted text
    uniqueMatches.forEach((match, i) => {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${i}`}>
            {text.substring(lastIndex, match.index)}
          </span>
        );
      }
      
      // Add bold match
      parts.push(
        <strong key={`bold-${i}`} className="font-semibold text-foreground">
          {match.text}
        </strong>
      );
      
      lastIndex = match.index + match.length;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(
        <span key="text-end">
          {text.substring(lastIndex)}
        </span>
      );
    }

    return parts;
  };

  // Split into sections (About the job, Why Join Us, Key Responsibilities, Qualifications)
  const sections = description.split(/\n{2,}/);

  return (
    <div className="space-y-6">
      {sections.map((section, sectionIdx) => {
        const lines = section.split('\n').filter(line => line.trim());
        
        return (
          <div key={sectionIdx} className="space-y-3">
            {lines.map((line, lineIdx) => {
              const trimmedLine = line.trim();
              
              // Check if it's a heading (no bullet point and short)
              const isHeading = !trimmedLine.startsWith('•') && 
                               !trimmedLine.startsWith('-') && 
                               trimmedLine.length < 50 &&
                               lineIdx === 0;
              
              if (isHeading) {
                return (
                  <h3 key={`${sectionIdx}-${lineIdx}`} className="text-lg font-semibold text-foreground">
                    {trimmedLine}
                  </h3>
                );
              }
              
              // Regular line or bullet point
              const cleanedLine = trimmedLine.replace(/^[•\-]\s*/, '');
              const isBullet = trimmedLine.startsWith('•') || trimmedLine.startsWith('-');
              
              return (
                <div key={`${sectionIdx}-${lineIdx}`} className="text-muted-foreground leading-relaxed">
                  {isBullet && (
                    <div className="flex gap-3">
                      <span className="text-foreground mt-1">•</span>
                      <span className="flex-1">{formatText(cleanedLine)}</span>
                    </div>
                  )}
                  {!isBullet && <p>{formatText(cleanedLine)}</p>}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
