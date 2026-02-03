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

interface Day7UpsellEmailProps {
  userName?: string;
  userEmail?: string;
  briefCount?: number;
  remainingBriefs?: number;
}

export const Day7UpsellEmail = ({
  userName = "there",
  userEmail,
  briefCount = 3,
  remainingBriefs = 3,
}: Day7UpsellEmailProps) => {
  const previewText = remainingBriefs === 0
    ? "Upgrade to keep creating professional briefs"
    : "Ready to scale? Upgrade for more briefs";

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

          <Heading style={h1}>
            {remainingBriefs === 0
              ? "You've used all your free briefs"
              : "Ready to create more briefs?"}
          </Heading>

          <Text style={text}>Hi {userName},</Text>

          {remainingBriefs === 0 ? (
            <Text style={text}>
              You've created <strong>{briefCount}</strong> professional briefs with ORIGO. That's
              awesome! 🎉
            </Text>
          ) : (
            <Text style={text}>
              You've created <strong>{briefCount}</strong> briefs so far. You have{" "}
              <strong>{remainingBriefs}</strong> remaining on your free plan.
            </Text>
          )}

          <Text style={text}>
            <strong>Upgrade to Pro and get:</strong>
          </Text>

          <div style={pricingBox}>
            <div style={pricingHeader}>
              <div>
                <span style={planName}>Pro Plan</span>
                <br />
                <span style={planDescription}>Perfect for agencies & freelancers</span>
              </div>
              <div style={priceContainer}>
                <span style={price}>$4.99</span>
                <span style={period}>/mo</span>
              </div>
            </div>

            <ul style={featureList}>
              <li style={featureItem}>
                <span style={checkmark}>✓</span>
                <strong>50 briefs per month</strong> - More than enough for busy freelancers
              </li>
              <li style={featureItem}>
                <span style={checkmark}>✓</span>
                <strong>Professional PDF exports</strong> - Custom branding options
              </li>
              <li style={featureItem}>
                <span style={checkmark}>✓</span>
                <strong>Brief templates</strong> - Save time with pre-filled templates
              </li>
              <li style={featureItem}>
                <span style={checkmark}>✓</span>
                <strong>Priority support</strong> - Get help when you need it
              </li>
            </ul>
          </div>

          <Section style={buttonContainer}>
            <Button
              style={button}
              href={`${process.env.NEXT_PUBLIC_APP_URL || 'https://origo.app'}/pricing`}
            >
              Upgrade to Pro - $4.99/mo
            </Button>
          </Section>

          <Text style={callout}>
            💰 <strong>Special offer:</strong> Get your first month for just $2.99 (use code FIRSTMONTH
            at checkout)
          </Text>

          <Hr style={hr} />

          <Text style={text}>
            <strong>Not ready yet?</strong> That's totally fine. Your free plan stays active - you'll
            get 3 more briefs next month.
          </Text>

          <Text style={text}>
            Questions? Just reply to this email.
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
              href={`${process.env.NEXT_PUBLIC_APP_URL || 'https://origo.app'}/pricing`}
              style={footerLink}
            >
              View all plans
            </Link>
            {" · "}
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

export default Day7UpsellEmail;

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

const pricingBox = {
  backgroundColor: "#f6f9fc",
  border: "2px solid #6366f1",
  borderRadius: "12px",
  margin: "24px 48px",
  padding: "24px",
};

const pricingHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "20px",
};

const planName = {
  fontSize: "20px",
  fontWeight: "700",
  color: "#1a1a2e",
};

const planDescription = {
  fontSize: "14px",
  color: "#525f7f",
};

const priceContainer = {
  textAlign: "right" as const,
};

const price = {
  fontSize: "32px",
  fontWeight: "700",
  color: "#6366f1",
};

const period = {
  fontSize: "16px",
  color: "#525f7f",
};

const featureList = {
  margin: "0",
  padding: "0",
  listStyle: "none",
};

const featureItem = {
  color: "#525f7f",
  fontSize: "15px",
  lineHeight: "24px",
  marginBottom: "12px",
  display: "flex",
  alignItems: "flex-start",
  gap: "8px",
};

const checkmark = {
  color: "#10b981",
  fontSize: "18px",
  fontWeight: "700",
  flexShrink: 0,
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

const callout = {
  backgroundColor: "#fef3c7",
  borderLeft: "4px solid #f59e0b",
  padding: "16px 24px",
  margin: "24px 48px",
  fontSize: "15px",
  lineHeight: "24px",
  color: "#78350f",
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
