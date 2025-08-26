# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - alert [ref=e2]
  - generic [ref=e5]:
    - generic [ref=e6]:
      - img "AXIS6 - Balance Across 6 Life Dimensions" [ref=e8]
      - heading "Welcome Back" [level=1] [ref=e9]
      - paragraph [ref=e10]: Continue your balance journey
    - generic [ref=e11]:
      - generic [ref=e12]:
        - generic [ref=e13]: Email
        - generic [ref=e14]:
          - img [ref=e15]
          - textbox "Email" [ref=e18]
      - generic [ref=e19]:
        - generic [ref=e20]: Password
        - generic [ref=e21]:
          - img [ref=e22]
          - textbox "Password" [ref=e25]
      - generic [ref=e26]:
        - generic [ref=e27]:
          - checkbox "Remember me" [ref=e28]
          - text: Remember me
        - link "Forgot your password?" [ref=e29] [cursor=pointer]:
          - /url: /auth/forgot
      - button "Sign In" [ref=e30] [cursor=pointer]:
        - text: Sign In
        - img [ref=e31] [cursor=pointer]
    - generic [ref=e33]:
      - text: Don't have an account?
      - link "Sign up free" [ref=e34] [cursor=pointer]:
        - /url: /auth/register
```