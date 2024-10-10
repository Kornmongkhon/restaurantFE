import React from 'react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { RootRoute } from './route/RootRoute';

const theme = createTheme({
  typography: {
    fontFamily: [
      'Prompt',
      'sans-serif',
    ].join(','),
  }
});

export const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <RootRoute />
    </ThemeProvider>
  )
}
