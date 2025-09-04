/**
 * Navigation debugging utilities
 */

export const NavigationDebug = {
  /**
   * Log navigation state for debugging
   */
  logNavigationState: (
    currentScreen: string,
    isAuthenticated: boolean,
    selectedCategory: any,
    navigationHistory: string[]
  ) => {
    console.log('=== Navigation State ===');
    console.log('Current Screen:', currentScreen);
    console.log('Is Authenticated:', isAuthenticated);
    console.log('Selected Category:', selectedCategory);
    console.log('Navigation History:', navigationHistory);
    console.log('========================');
  },

  /**
   * Log authentication state changes
   */
  logAuthStateChange: (
    oldState: boolean,
    newState: boolean,
    reason: string
  ) => {
    console.log('=== Auth State Change ===');
    console.log('Old State:', oldState);
    console.log('New State:', newState);
    console.log('Reason:', reason);
    console.log('Timestamp:', new Date().toISOString());
    console.log('=========================');
  },

  /**
   * Log screen transitions
   */
  logScreenTransition: (
    fromScreen: string,
    toScreen: string,
    trigger: string
  ) => {
    console.log('=== Screen Transition ===');
    console.log('From:', fromScreen);
    console.log('To:', toScreen);
    console.log('Trigger:', trigger);
    console.log('Timestamp:', new Date().toISOString());
    console.log('=========================');
  }
};
