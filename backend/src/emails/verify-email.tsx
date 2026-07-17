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

interface VerifyEmailProps {
  url: string;
  name?: string;
}

export function VerifyEmail({ url, name }: VerifyEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Verify your email address</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Verify your email</Heading>
          <Text style={text}>
            {name ? `Hi ${name},` : "Hi there,"} confirm this is your email
            address to finish setting up your account.
          </Text>
          <Button href={url} style={button}>
            Verify email
          </Button>
          <Text style={muted}>
            If you didn&apos;t create an account, you can safely ignore this
            email.
          </Text>
          <Text style={muted}>
            Or copy and paste this URL into your browser: {url}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default VerifyEmail;

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
