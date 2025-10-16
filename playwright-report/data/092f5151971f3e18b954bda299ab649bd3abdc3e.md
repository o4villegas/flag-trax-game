# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - navigation [ref=e3]:
      - generic [ref=e5]:
        - link "Flag Capture" [ref=e6] [cursor=pointer]:
          - /url: /
        - generic [ref=e7]:
          - link "Sign In" [ref=e8] [cursor=pointer]:
            - /url: /sign-in
            - button "Sign In" [ref=e9]
          - link "Sign Up" [ref=e10] [cursor=pointer]:
            - /url: /sign-up
            - button "Sign Up" [ref=e11]
    - main [ref=e12]:
      - generic [ref=e14]:
        - heading "Flag Capture Game" [level=1] [ref=e15]
        - paragraph [ref=e16]: Request physical flags, find them in the wild, capture them with QR codes, and track your journey!
        - generic [ref=e17]:
          - link "Get Started" [ref=e18] [cursor=pointer]:
            - /url: /sign-up
            - button "Get Started" [ref=e19]
          - link "Sign In" [ref=e20] [cursor=pointer]:
            - /url: /sign-in
            - button "Sign In" [ref=e21]
  - region "Notifications alt+T"
```