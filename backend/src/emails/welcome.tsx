import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from "@react-email/components";

interface WelcomeEmailProps {
  name?: string;
  loginUrl?: string;
}

export function WelcomeEmail({ name, loginUrl }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome aboard</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>
            Welcome{name ? `, ${name}` : ""}!
          </Heading>
          <Text style={text}>
            Your account is ready to go. We&apos;re glad you&apos;re here.
          </Text>
          {loginUrl ? (
            <Button href={loginUrl} style={button}>
              Go to dashboard
            </Button>
          ) : null}
          <Text style={muted}>
            If you have any questions, just reply to this email — we read
            every message.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default WelcomeEmail;

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "32px",
  borderRadius: "8px",
  maxWidth: "480px",
};

const heading = {
  fontSize: "20px",
  fontWeight: "600",
  color: "#1a1a1a",
};

const text = {
  fontSize: "14px",
  lineHeight: "22px",
  color: "#333333",
};

const muted = {
  fontSize: "12px",
  lineHeight: "20px",
  color: "#8898aa",
};

const button = {
  backgroundColor: "#111827",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "12px 20px",
  margin: "20px 0",
};
