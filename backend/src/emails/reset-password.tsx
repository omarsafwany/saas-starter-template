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

interface ResetPasswordEmailProps {
  url: string;
  name?: string;
}

export function ResetPasswordEmail({ url, name }: ResetPasswordEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Reset your password</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Reset your password</Heading>
          <Text style={text}>
            {name ? `Hi ${name},` : "Hi there,"} we received a request to
            reset the password for your account. Click the button below to
            choose a new one.
          </Text>
          <Button href={url} style={button}>
            Reset password
          </Button>
          <Text style={muted}>
            If you didn&apos;t request this, you can safely ignore this
            email — your password will stay the same.
          </Text>
          <Text style={muted}>
            Or copy and paste this URL into your browser: {url}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default ResetPasswordEmail;

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
