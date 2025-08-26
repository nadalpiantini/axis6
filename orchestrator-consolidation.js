#!/usr/bin/env node

/**
 * AXIS6 Orchestrator - Bug Report Consolidation
 * 
 * Este script consolida los reportes de los 5 sub-agentes paralelos
 * y genera un reporte unificado con priorización de bugs.
 * 
 * Uso:
 * node orchestrator-consolidation.js
 * 
 * Luego pegar los JSON reports de cada sub-agente cuando se solicite.
 */

const fs = require('fs');
const path = require('path');

class OrchestrationConsolidator {
  constructor() {
    this.subAgentReports = [];
    this.consolidatedReport = null;
  }

  // Simular entrada de reportes (en un chat real, el usuario pegaría los JSONs)
  addSubAgentReport(reportJson) {
    try {
      const report = typeof reportJson === 'string' ? JSON.parse(reportJson) : reportJson;
      this.subAgentReports.push(report);
      console.log(`✅ Added report from ${report.agent} (${report.totalBugs} bugs)`);
      return true;
    } catch (error) {
      console.error(`❌ Error parsing report: ${error.message}`);
      return false;
    }
  }

  // Consolidar todos los reportes
  consolidateReports() {
    if (this.subAgentReports.length === 0) {
      console.error('❌ No reports to consolidate');
      return null;
    }

    const allBugs = [];
    const agentSummaries = [];

    this.subAgentReports.forEach(report => {
      agentSummaries.push({
        agent: report.agent,
        totalBugs: report.totalBugs,
        critical: report.critical,
        high: report.high,
        medium: report.medium,
        low: report.low,
        completedAt: report.completedAt
      });

      // Agregar bugs con identificador del agente
      if (report.bugs && Array.isArray(report.bugs)) {
        report.bugs.forEach(bug => {
          allBugs.push({
            ...bug,
            source: report.agent
          });
        });
      }
    });

    // Ordenar bugs por severidad
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    allBugs.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    this.consolidatedReport = {
      orchestrationId: `axis6-audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      subAgentsCompleted: this.subAgentReports.length,
      expectedSubAgents: 5,
      agentSummaries,
      totalBugs: allBugs.length,
      severityBreakdown: {
        critical: allBugs.filter(b => b.severity === 'critical').length,
        high: allBugs.filter(b => b.severity === 'high').length,
        medium: allBugs.filter(b => b.severity === 'medium').length,
        low: allBugs.filter(b => b.severity === 'low').length
      },
      bugs: allBugs,
      recommendations: this.generateRecommendations(allBugs, agentSummaries),
      completedAt: new Date().toISOString()
    };

    return this.consolidatedReport;
  }

  // Generar recomendaciones basadas en los bugs encontrados
  generateRecommendations(allBugs, agentSummaries) {
    const recommendations = [];

    // Análisis de críticos
    const criticalBugs = allBugs.filter(b => b.severity === 'critical');
    if (criticalBugs.length > 0) {
      recommendations.push({
        priority: 'IMMEDIATE',
        action: `Fix ${criticalBugs.length} critical bugs immediately before any other work`,
        details: criticalBugs.map(b => `${b.page}: ${b.issue}`),
        estimatedTime: `${criticalBugs.length * 30} minutes`
      });
    }

    // Análisis de altos
    const highBugs = allBugs.filter(b => b.severity === 'high');
    if (highBugs.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        action: `Address ${highBugs.length} high-priority bugs within next 2 hours`,
        details: highBugs.slice(0, 5).map(b => `${b.page}: ${b.issue}`),
        estimatedTime: `${highBugs.length * 15} minutes`
      });
    }

    // Análisis por agente con más problemas
    const agentWithMostBugs = agentSummaries.reduce((prev, current) => 
      (prev.totalBugs > current.totalBugs) ? prev : current
    );

    if (agentWithMostBugs.totalBugs > 0) {
      recommendations.push({
        priority: 'FOCUS',
        action: `Focus on ${agentWithMostBugs.agent} area - highest bug concentration`,
        details: [`${agentWithMostBugs.totalBugs} bugs in ${agentWithMostBugs.agent} functionality`],
        estimatedTime: `${agentWithMostBugs.totalBugs * 10} minutes`
      });
    }

    // Análisis de errores de JavaScript
    const jsErrorBugs = allBugs.filter(b => 
      b.consoleErrors && b.consoleErrors.length > 0
    );

    if (jsErrorBugs.length > 0) {
      recommendations.push({
        priority: 'TECHNICAL',
        action: `Fix JavaScript errors affecting ${jsErrorBugs.length} areas`,
        details: [...new Set(jsErrorBugs.flatMap(b => b.consoleErrors))].slice(0, 3),
        estimatedTime: `${jsErrorBugs.length * 20} minutes`
      });
    }

    // Análisis de errores de API
    const apiErrorBugs = allBugs.filter(b => 
      b.networkLogs && b.networkLogs.some(log => log.includes('❌'))
    );

    if (apiErrorBugs.length > 0) {
      recommendations.push({
        priority: 'BACKEND',
        action: `Fix API errors affecting ${apiErrorBugs.length} features`,
        details: [...new Set(apiErrorBugs.flatMap(b => 
          b.networkLogs.filter(log => log.includes('❌'))
        ))].slice(0, 3),
        estimatedTime: `${apiErrorBugs.length * 25} minutes`
      });
    }

    // Si no hay bugs críticos, recomendar mejoras
    if (criticalBugs.length === 0) {
      recommendations.push({
        priority: 'CELEBRATION',
        action: '🎉 No critical bugs found! Application is stable',
        details: ['Focus on medium/low priority improvements', 'Consider adding more features'],
        estimatedTime: 'Ongoing'
      });
    }

    return recommendations;
  }

  // Generar reporte detallado
  generateDetailedReport() {
    if (!this.consolidatedReport) {
      return 'No consolidated report available. Run consolidateReports() first.';
    }

    const report = this.consolidatedReport;
    
    let output = '\n🎯 AXIS6 COMPREHENSIVE AUDIT - CONSOLIDATED REPORT\n';
    output += '================================================\n';
    output += `📊 Orchestration ID: ${report.orchestrationId}\n`;
    output += `📅 Completed: ${report.completedAt}\n`;
    output += `🤖 Sub-Agents: ${report.subAgentsCompleted}/${report.expectedSubAgents}\n\n`;

    // Resumen de severidad
    output += '📈 SEVERITY BREAKDOWN\n';
    output += '-------------------\n';
    output += `🔴 Critical: ${report.severityBreakdown.critical}\n`;
    output += `🟠 High: ${report.severityBreakdown.high}\n`;
    output += `🟡 Medium: ${report.severityBreakdown.medium}\n`;
    output += `🟢 Low: ${report.severityBreakdown.low}\n`;
    output += `📊 Total: ${report.totalBugs}\n\n`;

    // Resumen por agente
    output += '🤖 SUB-AGENT PERFORMANCE\n';
    output += '----------------------\n';
    report.agentSummaries.forEach(agent => {
      output += `${agent.agent}: ${agent.totalBugs} bugs `;
      output += `(C:${agent.critical} H:${agent.high} M:${agent.medium} L:${agent.low})\n`;
    });
    output += '\n';

    // Recomendaciones
    output += '🎯 PRIORITY RECOMMENDATIONS\n';
    output += '-------------------------\n';
    report.recommendations.forEach((rec, index) => {
      output += `${index + 1}. [${rec.priority}] ${rec.action}\n`;
      output += `   Estimated Time: ${rec.estimatedTime}\n`;
      if (rec.details.length > 0) {
        output += `   Details:\n`;
        rec.details.forEach(detail => {
          output += `   - ${detail}\n`;
        });
      }
      output += '\n';
    });

    // Top 10 bugs más críticos
    output += '🐛 TOP 10 MOST CRITICAL BUGS\n';
    output += '----------------------------\n';
    const topBugs = report.bugs.slice(0, 10);
    topBugs.forEach((bug, index) => {
      output += `${index + 1}. [${bug.severity.toUpperCase()}] ${bug.page}\n`;
      output += `   Source: ${bug.source}\n`;
      output += `   Element: ${bug.element}\n`;
      output += `   Issue: ${bug.issue}\n`;
      output += `   Screenshot: ${bug.screenshot}\n\n`;
    });

    return output;
  }

  // Generar plan de acción
  generateActionPlan() {
    if (!this.consolidatedReport) {
      return 'No consolidated report available.';
    }

    const report = this.consolidatedReport;
    const criticalBugs = report.bugs.filter(b => b.severity === 'critical');
    const highBugs = report.bugs.filter(b => b.severity === 'high');

    let plan = '\n🚀 AXIS6 BUG FIX ACTION PLAN\n';
    plan += '=========================\n\n';

    if (criticalBugs.length > 0) {
      plan += '🔴 PHASE 1: CRITICAL BUGS (DO FIRST)\n';
      plan += '-----------------------------------\n';
      criticalBugs.forEach((bug, index) => {
        plan += `${index + 1}. Fix: ${bug.page} - ${bug.element}\n`;
        plan += `   Issue: ${bug.issue}\n`;
        plan += `   File: Find element "${bug.element}" in page component\n`;
        plan += `   Priority: IMMEDIATE\n\n`;
      });
    }

    if (highBugs.length > 0) {
      plan += '🟠 PHASE 2: HIGH PRIORITY BUGS\n';
      plan += '-----------------------------\n';
      highBugs.slice(0, 5).forEach((bug, index) => {
        plan += `${index + 1}. Fix: ${bug.page} - ${bug.element}\n`;
        plan += `   Issue: ${bug.issue}\n`;
        plan += `   Priority: Next 2 hours\n\n`;
      });
    }

    plan += '🔧 IMPLEMENTATION COMMANDS\n';
    plan += '------------------------\n';
    plan += 'After fixes, re-run specific tests to verify:\n\n';
    
    const agentsWithCritical = [...new Set(criticalBugs.map(b => b.source))];
    agentsWithCritical.forEach(agent => {
      plan += `# Re-test ${agent}\n`;
      plan += `PLAYWRIGHT_BASE_URL=https://axis6.app npx playwright test tests/e2e/audit-${agent.replace('-', '-')}.spec.ts --reporter=line\n\n`;
    });

    return plan;
  }

  // Exportar reporte completo
  exportReport() {
    if (!this.consolidatedReport) {
      console.error('❌ No report to export');
      return;
    }

    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const filename = `axis6-audit-report-${timestamp}.json`;
    const filepath = path.join(process.cwd(), 'test-results', filename);

    // Crear directorio si no existe
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filepath, JSON.stringify(this.consolidatedReport, null, 2));
    console.log(`📄 Report exported to: ${filepath}`);

    // También crear reporte legible
    const readableFilename = `axis6-audit-report-${timestamp}.txt`;
    const readableFilepath = path.join(process.cwd(), 'test-results', readableFilename);
    
    fs.writeFileSync(readableFilepath, this.generateDetailedReport() + '\n\n' + this.generateActionPlan());
    console.log(`📖 Readable report exported to: ${readableFilepath}`);
  }
}

// Función principal para uso interactivo
function main() {
  console.log('🎭 AXIS6 Orchestrator Consolidation Tool');
  console.log('=======================================\n');
  
  const consolidator = new OrchestrationConsolidator();
  
  console.log('📋 Instructions:');
  console.log('1. Run each of the 5 sub-agent tests in parallel chats');
  console.log('2. Copy the JSON report from each sub-agent');
  console.log('3. Add each report using consolidator.addSubAgentReport(jsonString)');
  console.log('4. Run consolidator.consolidateReports() when all 5 are added');
  console.log('5. Generate reports with consolidator.generateDetailedReport()\n');
  
  // Ejemplo de uso (esto se ejecutaría en el chat orquestador)
  console.log('💡 Example usage in orchestrator chat:');
  console.log('const consolidator = new OrchestrationConsolidator();');
  console.log('consolidator.addSubAgentReport(`{...json from sub-agent 1...}`);');
  console.log('consolidator.addSubAgentReport(`{...json from sub-agent 2...}`);');
  console.log('// ... add all 5 reports ...');
  console.log('consolidator.consolidateReports();');
  console.log('console.log(consolidator.generateDetailedReport());');
  console.log('console.log(consolidator.generateActionPlan());');
  console.log('consolidator.exportReport();\n');
  
  // Hacer disponible para el REPL si se ejecuta interactivamente
  if (typeof global !== 'undefined') {
    global.OrchestrationConsolidator = OrchestrationConsolidator;
    global.consolidator = consolidator;
  }
  
  return consolidator;
}

module.exports = { OrchestrationConsolidator };

// Si se ejecuta directamente
if (require.main === module) {
  main();
}