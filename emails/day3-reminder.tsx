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

interface Day3ReminderEmailProps {
  userName?: string;
  userEmail?: string;
  briefCount?: number;
  remainingBriefs?: number;
}

export const Day3ReminderEmail = ({
  userName = "there",
  userEmail,
  briefCount = 3,
  remainingBriefs = 3,
}: Day3ReminderEmailProps) => {
  const previewText =
    briefCount === 0
      ? "Ready to create your first project brief?"
      : "Keep the momentum going - create your next brief";

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

          {briefCount === 0 ? (
            <>
              <Heading style={h1}>Ready to create your first brief?</Heading>

              <Text style={text}>Hi {userName},</Text>

              <Text style={text}>
                You signed up for ORIGO 3 days ago, but haven't created your first project brief yet.
              </Text>

              <Text style={text}>
                <strong>Here's why other freelancers love ORIGO:</strong>
              </Text>

              <ul style={list}>
                <li style={listItem}>
                  <strong>Save 2 hours per project</strong> - Stop writing briefs from scratch
                </li>
                <li style={listItem}>
                  <strong>Win more clients</strong> - Professional briefs make you look serious
                </li>
                <li style={listItem}>
                  <strong>Stop scope creep</strong> - Reference the brief when clients ask for extras
                </li>
              </ul>

              <Text style={text}>
                Your first brief takes just <strong>5 minutes</strong>. Try it with your next client
                request.
              </Text>
            </>
          ) : (
            <>
              <Heading style={h1}>Great start! Keep going.</Heading>

              <Text style={text}>Hi {userName},</Text>

              <Text style={text}>
                You've created <strong>{briefCount}</strong> {briefCount === 1 ? "brief" : "briefs"} so
                far. You still have <strong>{remainingBriefs}</strong> remaining this month.
              </Text>

              <Text style={text}>
                Here are some tips to get the most out of ORIGO:
              </Text>

              <ul style={list}>
                <li style={listItem}>
                  <strong>Use it for discovery calls</strong> - Take notes during client calls, generate
                  the brief afterward
                </li>
                <li style={listItem}>
                  <strong>Share the PDF before kickoff</strong> - Get client sign-off to avoid scope
                  creep
                </li>
                <li style={listItem}>
                  <strong>Keep it simple</strong> - The AI structures everything, just answer the
                  questions
                </li>
              </ul>

              <Text style={text}>Ready to create your next brief?</Text>
            </>
          )}

          <Section style={buttonContainer}>
            <Button
              style={button}
              href={`${process.env.NEXT_PUBLIC_APP_URL || 'https://origo.app'}/brief/new`}
            >
              {briefCount === 0 ? "Create My First Brief" : "Create Another Brief"}
            </Button>
          </Section>

          <Text style={text}>
            Need help? Reply to this email - I read every message.
          </Text>

          <Hr style={hr} />

          <Text style={footer}>
            ORIGO - Professional project briefs in 5 minutes
            <br />
            {userEmail && (
              <>
                This email was sent to {userEmail}
                <br />
              </>
            )}
            <Link
              href={`${process.env.NEXT_PUBLIC_APP_URL || 'https://origo.app'}/account`}
              style={footerLink}
            >
              Manage preferences
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default Day3ReminderEmail;

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
