/**
 * Mobile Testing Runner
 * Execute comprehensive mobile testing and generate report
 */

import { mobileTestingSuite } from './mobileTestingSuite';

export async function runMobileTests() {
  console.log('🚀 Starting comprehensive mobile responsiveness testing...');
  
  try {
    // Run full mobile test suite
    const results = await mobileTestingSuite.runFullMobileSuite();
    
    // Generate detailed report
    const report = mobileTestingSuite.generateMobileReport(results);
    
    // Log summary to console
    console.log('\n📊 Mobile Testing Summary:');
    console.log(`✅ Passed: ${results.summary.passed}/${results.summary.totalTests}`);
    console.log(`❌ Failed: ${results.summary.failed}/${results.summary.totalTests}`);
    console.log(`🚨 Critical Issues: ${results.summary.criticalIssues}`);
    
    // Identify critical issues that need immediate attention
    const criticalIssues = [
      ...results.touchTargets.filter(t => !t.passed),
      ...results.accessibility.filter(a => !a.passed),
      ...results.usability.filter(u => !u.passed && u.testType === 'usability')
    ];
    
    if (criticalIssues.length > 0) {
      console.log('\n🔥 Critical Issues Requiring Immediate Attention:');
      criticalIssues.forEach((issue, index) => {
        const name = 'element' in issue ? issue.element : issue.component;
        console.log(`${index + 1}. ${name}`);
      });
    }
    
    // Return results for further processing
    return {
      results,
      report,
      criticalIssues,
      needsImmediateAttention: criticalIssues.length > 0
    };
    
  } catch (error) {
    console.error('❌ Mobile testing failed:', error);
    throw error;
  }
}

// Auto-run if called directly
if (require.main === module) {
  runMobileTests()
    .then(({ report, needsImmediateAttention }) => {
      console.log('\n📄 Full Report:');
      console.log(report);
      
      if (needsImmediateAttention) {
        console.log('\n⚠️  Mobile optimization required before production deployment!');
      } else {
        console.log('\n✨ Mobile responsiveness looks good! Ready for production.');
      }
    })
    .catch(error => {
      console.error('Fatal error during mobile testing:', error);
      process.exit(1);
    });
}
