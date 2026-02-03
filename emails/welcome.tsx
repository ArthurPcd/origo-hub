import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface WelcomeEmailProps {
  userName?: string;
  userEmail?: string;
}

export const WelcomeEmail = ({ userName = "there", userEmail }: WelcomeEmailProps) => {
  const previewText = "Welcome to ORIGO - Your project brief assistant";

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <div style={logo}>
              <div style={logoDot} />
              <span style={logoText}>ORIGO</span>
            </div>
          </Section>

          <Heading style={h1}>Welcome to ORIGO!</Heading>

          <Text style={text}>Hi {userName},</Text>

          <Text style={text}>
            Thanks for signing up! You're now ready to transform vague client requests into
            professional project briefs in minutes.
          </Text>

          <Text style={text}>Here's what you can do with your free account:</Text>

          <ul style={list}>
            <li style={listItem}>
              <strong>Create 3 professional briefs per month</strong> - Perfect for testing with real
              client projects
            </li>
            <li style={listItem}>
              <strong>AI-powered structure</strong> - Turn "can you make me a website?" into clear scope
            </li>
            <li style={listItem}>
              <strong>Export to PDF</strong> - Share polished briefs with clients instantly
            </li>
          </ul>

          <Section style={buttonContainer}>
            <Button style={button} href={`${process.env.NEXT_PUBLIC_APP_URL || 'https://origo.app'}/brief/new`}>
              Create Your First Brief
            </Button>
          </Section>

          <Text style={text}>
            Need help? Just reply to this email or check out our{" "}
            <Link href={`${process.env.NEXT_PUBLIC_APP_URL || 'https://origo.app'}/docs`} style={link}>
              documentation
            </Link>
            .
          </Text>

          <Hr style={hr} />

          <Text style={footer}>
            ORIGO - Stop losing clients to vague briefs
            <br />
            {userEmail && (
              <>
                This email was sent to {userEmail}
                <br />
              </>
            )}
            <Link href={`${process.env.NEXT_PUBLIC_APP_URL || 'https://origo.app'}`} style={footerLink}>
              origo.app
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default WelcomeEmail;

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  maxWidth: "600px",
};

const header = {
  padding: "32px 48px 24px",
};

const logo = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const logoDot = {
  width: "8px",
  height: "8px",
  borderRadius: "50%",
  backgroundColor: "#6366f1",
};

const logoText = {
  fontSize: "16px",
  fontWeight: "700",
  letterSpacing: "0.12em",
  color: "#1a1a2e",
};

const h1 = {
  color: "#1a1a2e",
  fontSize: "28px",
  fontWeight: "700",
  margin: "0 0 24px",
  padding: "0 48px",
  lineHeight: "1.3",
};

const text = {
  color: "#525f7f",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "0 0 16px",
  padding: "0 48px",
};

const list = {
  margin: "0 0 24px",
  padding: "0 48px 0 72px",
};

const listItem = {
  color: "#525f7f",
  fontSize: "15px",
  lineHeight: "24px",
  marginBottom: "12px",
};

const buttonContainer = {
  padding: "0 48px 24px",
};

const button = {
  backgroundColor: "#6366f1",
  borderRadius: "8px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "14px 24px",
};

const link = {
  color: "#6366f1",
  textDecoration: "underline",
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "32px 48px",
};

const footer = {
  color: "#8898aa",
  fontSize: "13px",
  lineHeight: "20px",
  margin: "0",
  padding: "0 48px",
};

const footerLink = {
  color: "#8898aa",
  textDecoration: "underline",
};
