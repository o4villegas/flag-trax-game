# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e3]:
    - generic [ref=e5]:
      - generic [ref=e6]:
        - generic [ref=e7]:
          - img [ref=e8]
          - text: Sign In
        - generic [ref=e11]: Enter your email and password to access your account
      - generic [ref=e12]:
        - generic [ref=e13]:
          - generic [ref=e14]:
            - generic [ref=e15]:
              - img [ref=e16]
              - text: Email
            - textbox "Email" [ref=e19]:
              - /placeholder: you@example.com
              - text: admin@test.com
          - generic [ref=e20]:
            - generic [ref=e21]:
              - img [ref=e22]
              - text: Password
            - textbox "Password" [ref=e25]:
              - /placeholder: Enter your password
              - text: Test123!
          - button "Sign In" [ref=e26]:
            - img
            - text: Sign In
        - paragraph [ref=e28]:
          - text: Don't have an account?
          - link "Sign up" [ref=e29] [cursor=pointer]:
            - /url: /sign-up
        - link "← Back to Home" [ref=e31] [cursor=pointer]:
          - /url: /
  - region "Notifications alt+T"
```