-- Insert accessibility statement document
INSERT INTO legal_documents (document_type, title, content)
VALUES (
  'accessibility_statement',
  'Accessibility Statement',
  $$# Accessibility Statement

Last updated: August 2025

## Our Commitment to Accessibility

HuntoriX is committed to ensuring digital accessibility for people with disabilities. We are continually improving the user experience for everyone and applying the relevant accessibility standards to ensure we provide equal access to all of our users.

## Conformance Status

The Web Content Accessibility Guidelines (WCAG) defines requirements for designers and developers to improve accessibility for people with disabilities. It defines three levels of conformance: Level A, Level AA, and Level AAA.

HuntoriX strives to conform to WCAG 2.1 Level AA standards. We are committed to making our platform accessible to all users, regardless of their abilities or the technologies they use.

## Accessibility Features

Our platform includes the following accessibility features:

### Keyboard Navigation
- Full keyboard navigation support throughout the platform
- Logical tab order for all interactive elements
- Visible focus indicators on all focusable elements
- Skip navigation links for easier content access

### Screen Reader Compatibility
- Semantic HTML structure for proper content hierarchy
- ARIA labels and landmarks for better screen reader navigation
- Alternative text for all meaningful images
- Descriptive link text and button labels

### Visual Design
- Sufficient color contrast ratios (WCAG AA compliant)
- Text that can be resized up to 200% without loss of functionality
- No reliance on color alone to convey information
- Clear and consistent navigation structure

### Content Accessibility
- Clear and simple language throughout the platform
- Headings and labels that describe content and functionality
- Error messages that are clear and provide guidance
- Time limits can be extended or disabled where applicable

## Known Limitations

While we strive for full accessibility, we acknowledge that some areas may still present challenges:

- Some third-party embedded content may not be fully accessible
- Certain interactive features are continuously being improved for better accessibility
- Legacy content may not meet current accessibility standards

We are actively working to address these limitations and welcome feedback on accessibility issues.

## Technical Specifications

HuntoriX relies on the following technologies to work with your web browser and any assistive technologies:

- HTML5
- CSS3
- JavaScript
- React
- ARIA (Accessible Rich Internet Applications)

These technologies are relied upon for conformance with the accessibility standards used.

## Assistive Technologies We Support

Our platform is designed to be compatible with the following assistive technologies:

- Screen readers (JAWS, NVDA, VoiceOver, TalkBack)
- Screen magnification software
- Speech recognition software
- Alternative input devices
- Browser accessibility features

## Assessment and Testing

We regularly conduct accessibility assessments using:

- Automated accessibility testing tools
- Manual testing with keyboard navigation
- Screen reader testing
- Real-world testing with users who have disabilities
- Regular audits against WCAG 2.1 Level AA criteria

## Third-Party Content

Some content on our platform may be provided by third parties. While we require our partners to maintain accessibility standards, we cannot always guarantee the accessibility of third-party content.

## Feedback and Contact Information

We welcome your feedback on the accessibility of HuntoriX. Please let us know if you encounter accessibility barriers:

**Email:** hello@huntorix.com  
**Subject Line:** Accessibility Feedback

We aim to respond to accessibility feedback within **5 business days**.

Please provide the following information when reporting accessibility issues:

- The page or feature you were trying to access
- The problem you encountered
- Your browser and assistive technology (if applicable)
- Any other relevant details

## Formal Complaints

If you are not satisfied with our response to your accessibility concern, you may file a formal complaint with the relevant authorities in your jurisdiction:

### United States
- U.S. Department of Justice
- ADA.gov

### European Union
- Your national data protection authority
- EU Web Accessibility Directive enforcement body

### Israel
- Commission for Equal Rights of Persons with Disabilities
- Ministry of Justice

## Ongoing Efforts

We are committed to continuous improvement of our accessibility standards. Our ongoing efforts include:

- Regular accessibility audits and testing
- Staff training on accessibility best practices
- Incorporating accessibility into our design and development processes
- Engaging with the disability community for feedback
- Staying current with evolving accessibility standards and technologies

## Standards and Compliance

HuntoriX strives to comply with:

- **WCAG 2.1 Level AA** (Web Content Accessibility Guidelines)
- **ADA** (Americans with Disabilities Act) - Title III
- **Section 508** of the Rehabilitation Act
- **EU Web Accessibility Directive** (2016/2102)
- **Israeli Equal Rights for Persons with Disabilities Law** (1998)
- **Israeli Standard 5568** (Web Content Accessibility)

## Date of Last Review

This accessibility statement was last reviewed and updated on **August 2025**.

We review and update this statement regularly to reflect our current accessibility status and any changes to our services.

## Contact Us

For any accessibility-related questions or concerns:

📧 **hello@huntorix.com**

🌍 **HuntoriX – AI-Powered Hiring & Headhunter Platform**

We are committed to making our platform accessible to everyone and appreciate your patience as we work to improve.$$
)
ON CONFLICT (document_type) DO UPDATE
SET 
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  updated_at = now();